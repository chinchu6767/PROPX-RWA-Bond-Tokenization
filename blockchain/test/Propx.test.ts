
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Propx Protocol – Full Integration Tests", function () {
  let deployer: HardhatEthersSigner;
  let investor1: HardhatEthersSigner;
  let investor2: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  // Using any here avoids stale TypeChain deployment type errors.
  let mpt: any;
  let ii: any;
  let bar: any;
  let rv: any;
  let bt: any;
  let bm: any;
  let cm: any;

  const BOND_ID = "BOND001";
  const FACE_VALUE = ethers.parseUnits("10000000", 18);
  const TOKEN_PRICE = ethers.parseUnits("1000", 18);
  const TOTAL_SUPPLY = 10_000n;
  const COUPON_BPS = 800;
  let maturityDate: number;

  beforeEach(async () => {
    [deployer, investor1, investor2, unauthorized] =
      await ethers.getSigners();

    maturityDate = (await time.latest()) + 3 * 365 * 24 * 3600;

    mpt = await (await ethers.getContractFactory("MockPaymentToken")).deploy();

    ii = await (await ethers.getContractFactory("InvestorIdentity"))
      .deploy(deployer.address);

    bar = await (await ethers.getContractFactory("BondAssetRegistry"))
      .deploy(deployer.address);

    rv = await (await ethers.getContractFactory("ReserveVerifier"))
      .deploy(deployer.address);

    bt = await (await ethers.getContractFactory("BondToken")).deploy(
      BOND_ID,
      "Propx Gov Infra Bond Token",
      "PGIB",
      TOTAL_SUPPLY,
      await bar.getAddress(),
      await ii.getAddress(),
      await rv.getAddress(),
      deployer.address
    );

    bm = await (await ethers.getContractFactory("BondMarketplace")).deploy(
      await mpt.getAddress(),
      await ii.getAddress(),
      await bar.getAddress(),
      deployer.address
    );

    // Allow marketplace to hold bond tokens in escrow.
    await bt.setTrustedContract(await bm.getAddress(), true);

    cm = await (await ethers.getContractFactory("CouponManager")).deploy(
      BOND_ID,
      await mpt.getAddress(),
      await bt.getAddress(),
      await ii.getAddress(),
      await bar.getAddress(),
      deployer.address
    );

    const MINTER = ethers.keccak256(
      ethers.toUtf8Bytes("MINTER_ROLE")
    );

    const BURNER = ethers.keccak256(
      ethers.toUtf8Bytes("BURNER_ROLE")
    );

    await bt.grantRole(MINTER, deployer.address);
    await bt.grantRole(BURNER, await cm.getAddress());
  });

  // ==========================================
  // INVESTOR IDENTITY TESTS
  // ==========================================

  describe("InvestorIdentity", () => {
    it("investor can register", async () => {
      await ii.connect(investor1).registerInvestor();
      expect(await ii.getInvestorStatus(investor1.address)).to.equal(1);
    });

    it("prevents double registration", async () => {
      await ii.connect(investor1).registerInvestor();

      await expect(
        ii.connect(investor1).registerInvestor()
      ).to.be.revertedWith("InvestorIdentity: already registered");
    });

    it("admin can approve investor", async () => {
      await ii.connect(investor1).registerInvestor();
      await ii.approveInvestor(investor1.address, ethers.ZeroHash);

      expect(await ii.isApproved(investor1.address)).to.be.true;
    });

    it("admin can reject investor", async () => {
      await ii.connect(investor1).registerInvestor();
      await ii.rejectInvestor(investor1.address, "Documents incomplete");

      expect(await ii.getInvestorStatus(investor1.address)).to.equal(3);
    });

    it("admin can suspend approved investor", async () => {
      await ii.connect(investor1).registerInvestor();
      await ii.approveInvestor(investor1.address, ethers.ZeroHash);
      await ii.suspendInvestor(investor1.address, "Suspicious activity");

      expect(await ii.getInvestorStatus(investor1.address)).to.equal(4);
    });

    it("unauthorised cannot approve investor", async () => {
      await ii.connect(investor1).registerInvestor();

      await expect(
        ii.connect(unauthorized).approveInvestor(
          investor1.address,
          ethers.ZeroHash
        )
      ).to.be.reverted;
    });

    it("totalInvestors increments correctly", async () => {
      await ii.connect(investor1).registerInvestor();
      await ii.connect(investor2).registerInvestor();

      expect(await ii.totalInvestors()).to.equal(2);
    });
  });

  // ==========================================
  // BOND ASSET REGISTRY TESTS
  // ==========================================

  describe("BondAssetRegistry", () => {
    async function registerBond() {
      await bar.registerBond(
        BOND_ID,
        "Gov Bond",
        "Desc",
        FACE_VALUE,
        COUPON_BPS,
        maturityDate,
        TOKEN_PRICE,
        TOTAL_SUPPLY
      );
    }

    it("registers a bond with correct data", async () => {
      await registerBond();

      const bond = await bar.getBond(BOND_ID);

      expect(bond.name).to.equal("Gov Bond");
      expect(bond.faceValue).to.equal(FACE_VALUE);
      expect(bond.totalSupply).to.equal(TOTAL_SUPPLY);
    });

    it("prevents duplicate bond IDs", async () => {
      await registerBond();

      await expect(registerBond()).to.be.revertedWith(
        "BondAssetRegistry: bondId already exists"
      );
    });

    it("admin approves a bond", async () => {
      await registerBond();
      await bar.approveBond(BOND_ID);

      expect(await bar.isBondApproved(BOND_ID)).to.be.true;
    });

    it("admin rejects a bond", async () => {
      await registerBond();
      await bar.rejectBond(BOND_ID, "Invalid documentation");

      expect(await bar.getBondStatus(BOND_ID)).to.equal(3);
    });

    it("unauthorised cannot approve bond", async () => {
      await registerBond();

      await expect(
        bar.connect(unauthorized).approveBond(BOND_ID)
      ).to.be.reverted;
    });

    it("reverts when faceValue does not match tokenPrice times supply", async () => {
      await expect(
        bar.registerBond(
          BOND_ID,
          "Bond",
          "Desc",
          FACE_VALUE + 1n,
          COUPON_BPS,
          maturityDate,
          TOKEN_PRICE,
          TOTAL_SUPPLY
        )
      ).to.be.revertedWith(
        "BondAssetRegistry: faceValue != tokenPrice * totalSupply"
      );
    });
  });

  // ==========================================
  // RESERVE VERIFIER TESTS
  // ==========================================

  describe("ReserveVerifier", () => {
    it("reports and verifies reserves", async () => {
      await rv.reportReserve(BOND_ID, FACE_VALUE, FACE_VALUE);
      await rv.verifyReserve(BOND_ID);

      expect(await rv.isReserveVerified(BOND_ID)).to.be.true;
    });

    it("rejects insufficient reserve coverage", async () => {
      await rv.reportReserve(BOND_ID, FACE_VALUE / 2n, FACE_VALUE);

      await expect(
        rv.verifyReserve(BOND_ID)
      ).to.be.revertedWith("ReserveVerifier: coverage insufficient");
    });

    it("unauthorised cannot report reserves", async () => {
      await expect(
        rv.connect(unauthorized).reportReserve(
          BOND_ID,
          FACE_VALUE,
          FACE_VALUE
        )
      ).to.be.reverted;
    });

    it("isMintingEligible returns false if no report", async () => {
      const [eligible] = await rv.isMintingEligible(BOND_ID);

      expect(eligible).to.be.false;
    });

    it("isMintingEligible returns true after verification", async () => {
      await rv.reportReserve(BOND_ID, FACE_VALUE, FACE_VALUE);
      await rv.verifyReserve(BOND_ID);

      const [eligible] = await rv.isMintingEligible(BOND_ID);

      expect(eligible).to.be.true;
    });
  });

  // ==========================================
  // BOND TOKEN TESTS
  // ==========================================

  describe("BondToken", () => {
    beforeEach(async () => {
      await bar.registerBond(
        BOND_ID,
        "Gov Bond",
        "Desc",
        FACE_VALUE,
        COUPON_BPS,
        maturityDate,
        TOKEN_PRICE,
        TOTAL_SUPPLY
      );

      await bar.approveBond(BOND_ID);

      await rv.reportReserve(BOND_ID, FACE_VALUE, FACE_VALUE);
      await rv.verifyReserve(BOND_ID);

      await ii.connect(investor1).registerInvestor();
      await ii.approveInvestor(investor1.address, ethers.ZeroHash);
    });

    it("mints tokens to approved investor", async () => {
      await bt.mint(investor1.address, 100);

      expect(await bt.balanceOf(investor1.address)).to.equal(100);
    });

    it("prevents minting to unapproved investor", async () => {
      await expect(
        bt.mint(investor2.address, 100)
      ).to.be.revertedWith(
        "BondToken: recipient not approved investor"
      );
    });

    it("prevents exceeding max supply", async () => {
      await bt.mint(investor1.address, TOTAL_SUPPLY);

      await expect(
        bt.mint(investor1.address, 1)
      ).to.be.revertedWith(
        "BondToken: would exceed max supply"
      );
    });

    it("prevents transfer to unapproved investor", async () => {
      await bt.mint(investor1.address, 10);

      await expect(
        bt.connect(investor1).transfer(investor2.address, 5)
      ).to.be.revertedWith(
        "BondToken: recipient not approved investor"
      );
    });

    it("allows transfer between approved investors", async () => {
      await ii.connect(investor2).registerInvestor();
      await ii.approveInvestor(investor2.address, ethers.ZeroHash);

      await bt.mint(investor1.address, 10);
      await bt.connect(investor1).transfer(investor2.address, 5);

      expect(await bt.balanceOf(investor2.address)).to.equal(5);
    });

    it("unauthorised cannot mint", async () => {
      await expect(
        bt.connect(unauthorized).mint(investor1.address, 10)
      ).to.be.reverted;
    });

    it("has zero decimals", async () => {
      expect(await bt.decimals()).to.equal(0);
    });
  });

  // ==========================================
  // BOND MARKETPLACE TESTS
  // ==========================================

  describe("BondMarketplace", () => {
    beforeEach(async () => {
      await bar.registerBond(
        BOND_ID,
        "Gov Bond",
        "Desc",
        FACE_VALUE,
        COUPON_BPS,
        maturityDate,
        TOKEN_PRICE,
        TOTAL_SUPPLY
      );

      await bar.approveBond(BOND_ID);

      await rv.reportReserve(BOND_ID, FACE_VALUE, FACE_VALUE);
      await rv.verifyReserve(BOND_ID);

      await ii.connect(investor1).registerInvestor();
      await ii.approveInvestor(investor1.address, ethers.ZeroHash);

      await ii.connect(investor2).registerInvestor();
      await ii.approveInvestor(investor2.address, ethers.ZeroHash);

      await bt.mint(investor1.address, 100);

      await mpt.mint(
        investor2.address,
        ethers.parseUnits("5000000", 18)
      );
    });

    it("creates a listing and escrows tokens", async () => {
      const marketAddr = await bm.getAddress();

      await bt.connect(investor1).approve(marketAddr, 50);

      await bm.connect(investor1).createListing(
        await bt.getAddress(),
        BOND_ID,
        50,
        TOKEN_PRICE,
        7 * 24 * 3600
      );

      const listing = await bm.getListing(0);

      expect(listing.quantity).to.equal(50);
      expect(await bt.balanceOf(marketAddr)).to.equal(50);
    });

    it("investor2 purchases tokens from listing", async () => {
      const marketAddr = await bm.getAddress();

      await bt.connect(investor1).approve(marketAddr, 50);

      await bm.connect(investor1).createListing(
        await bt.getAddress(),
        BOND_ID,
        50,
        TOKEN_PRICE,
        7 * 24 * 3600
      );

      const cost = TOKEN_PRICE * 10n;

      await mpt.connect(investor2).approve(marketAddr, cost);

      await bm.connect(investor2).purchaseTokens(0, 10);

      expect(await bt.balanceOf(investor2.address)).to.equal(10);
    });

    it("prevents seller buying their own listing", async () => {
      const marketAddr = await bm.getAddress();

      await bt.connect(investor1).approve(marketAddr, 50);

      await bm.connect(investor1).createListing(
        await bt.getAddress(),
        BOND_ID,
        50,
        TOKEN_PRICE,
        7 * 24 * 3600
      );

      await mpt.mint(
        investor1.address,
        ethers.parseUnits("1000000", 18)
      );

      await mpt.connect(investor1).approve(
        marketAddr,
        TOKEN_PRICE * 10n
      );

      await expect(
        bm.connect(investor1).purchaseTokens(0, 10)
      ).to.be.revertedWith(
        "BondMarketplace: cannot buy own listing"
      );
    });

    it("unapproved investor cannot create listing", async () => {
      await expect(
        bm.connect(unauthorized).createListing(
          await bt.getAddress(),
          BOND_ID,
          10,
          TOKEN_PRICE,
          86400
        )
      ).to.be.revertedWith(
        "BondMarketplace: seller not approved"
      );
    });

    it("seller can cancel and retrieve tokens", async () => {
      const marketAddr = await bm.getAddress();

      await bt.connect(investor1).approve(marketAddr, 50);

      await bm.connect(investor1).createListing(
        await bt.getAddress(),
        BOND_ID,
        50,
        TOKEN_PRICE,
        7 * 24 * 3600
      );

      const balBefore = await bt.balanceOf(investor1.address);

      await bm.connect(investor1).cancelListing(0);

      expect(await bt.balanceOf(investor1.address)).to.equal(
        balBefore + 50n
      );
    });
  });

  // ==========================================
  // COUPON MANAGER TESTS
  // ==========================================

  describe("CouponManager", () => {
    const COUPON_PER_TOKEN = ethers.parseUnits("800", 18);

    beforeEach(async () => {
      await bar.registerBond(
        BOND_ID,
        "Gov Bond",
        "Desc",
        FACE_VALUE,
        COUPON_BPS,
        maturityDate,
        TOKEN_PRICE,
        TOTAL_SUPPLY
      );

      await bar.approveBond(BOND_ID);

      await rv.reportReserve(BOND_ID, FACE_VALUE, FACE_VALUE);
      await rv.verifyReserve(BOND_ID);

      await ii.connect(investor1).registerInvestor();
      await ii.approveInvestor(investor1.address, ethers.ZeroHash);

      await bt.mint(investor1.address, 100);
    });

    async function fundCoupon() {
      const totalFunded = COUPON_PER_TOKEN * 100n;

      await mpt.approve(await cm.getAddress(), totalFunded);

      await cm.fundCouponPeriod(COUPON_PER_TOKEN, 0);
    }

    it("admin funds a coupon period", async () => {
      await fundCoupon();

      const period = await cm.getCouponPeriod(0);

      expect(period.couponPerToken).to.equal(COUPON_PER_TOKEN);
      expect(period.isActive).to.be.true;
    });

    it("investor claims coupon", async () => {
      await fundCoupon();

      const balBefore = await mpt.balanceOf(investor1.address);

      await cm.connect(investor1).claimCoupon(0);

      const balAfter = await mpt.balanceOf(investor1.address);

      expect(balAfter - balBefore).to.equal(
        COUPON_PER_TOKEN * 100n
      );
    });

    it("prevents duplicate coupon claim", async () => {
      await fundCoupon();

      await cm.connect(investor1).claimCoupon(0);

      await expect(
        cm.connect(investor1).claimCoupon(0)
      ).to.be.revertedWith(
        "CouponManager: already claimed"
      );
    });

    it("prevents redemption before maturity", async () => {
      await mpt.transfer(
        await cm.getAddress(),
        TOKEN_PRICE * 100n
      );

      await expect(
        cm.connect(investor1).redeemBond(10)
      ).to.be.revertedWith(
        "CouponManager: bond not yet matured"
      );
    });

    it("allows redemption at maturity", async () => {
      await time.increaseTo(maturityDate);

      const redemptionAmt = TOKEN_PRICE * 10n;

      await mpt.transfer(
        await cm.getAddress(),
        redemptionAmt
      );

      const balBefore = await mpt.balanceOf(investor1.address);

      await cm.connect(investor1).redeemBond(10);

      expect(
        (await mpt.balanceOf(investor1.address)) - balBefore
      ).to.equal(redemptionAmt);

      expect(await bt.balanceOf(investor1.address)).to.equal(90);
    });

    it("prevents double redemption", async () => {
      await time.increaseTo(maturityDate);

      await mpt.transfer(
        await cm.getAddress(),
        TOKEN_PRICE * 100n
      );

      await cm.connect(investor1).redeemBond(10);

      await expect(
        cm.connect(investor1).redeemBond(10)
      ).to.be.revertedWith(
        "CouponManager: already redeemed"
      );
    });

    it("unapproved investor cannot claim coupon", async () => {
      await fundCoupon();

      await expect(
        cm.connect(unauthorized).claimCoupon(0)
      ).to.be.revertedWith(
        "CouponManager: not approved investor"
      );
    });
  });
});
