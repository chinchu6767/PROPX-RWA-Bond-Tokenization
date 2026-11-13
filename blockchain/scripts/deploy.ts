
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("=".repeat(60));
  console.log("       PROPХ PROTOCOL - FULL DEPLOYMENT");
  console.log("=".repeat(60));
  console.log("Deployer :", deployer.address);
  console.log("Network  :", network.name);
  console.log("Chain ID :", network.chainId.toString());
  console.log(
    "Balance  :",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // 1. Deploy MockPaymentToken
  console.log("\n[1/7] Deploying MockPaymentToken...");

  const MPT = await ethers.getContractFactory("MockPaymentToken");
  const mpt = await MPT.deploy();
  await mpt.waitForDeployment();

  const paymentAddr = await mpt.getAddress();
  console.log("Payment Token:", paymentAddr);

  // 2. Deploy InvestorIdentity
  console.log("\n[2/7] Deploying InvestorIdentity...");

  const II = await ethers.getContractFactory("InvestorIdentity");
  const ii = await II.deploy(deployer.address);
  await ii.waitForDeployment();

  const identityAddr = await ii.getAddress();
  console.log("Investor Identity:", identityAddr);

  // 3. Deploy BondAssetRegistry
  console.log("\n[3/7] Deploying BondAssetRegistry...");

  const BAR = await ethers.getContractFactory("BondAssetRegistry");
  const bar = await BAR.deploy(deployer.address);
  await bar.waitForDeployment();

  const registryAddr = await bar.getAddress();
  console.log("Bond Registry:", registryAddr);

  // 4. Deploy ReserveVerifier
  console.log("\n[4/7] Deploying ReserveVerifier...");

  const RV = await ethers.getContractFactory("ReserveVerifier");
  const rv = await RV.deploy(deployer.address);
  await rv.waitForDeployment();

  const reserveAddr = await rv.getAddress();
  console.log("Reserve Verifier:", reserveAddr);

  // 5. Deploy BondToken
  const BOND_ID = "BOND001";
  const MAX_SUPPLY = 10_000n;

  console.log("\n[5/7] Deploying BondToken...");

  const BT = await ethers.getContractFactory("BondToken");
  const bt = await BT.deploy(
    BOND_ID,
    "Propx Government Infrastructure Bond Token",
    "PGIB",
    MAX_SUPPLY,
    registryAddr,
    identityAddr,
    reserveAddr,
    deployer.address
  );

  await bt.waitForDeployment();

  const tokenAddr = await bt.getAddress();
  console.log("Bond Token:", tokenAddr);

  // 6. Deploy BondMarketplace
  console.log("\n[6/7] Deploying BondMarketplace...");

  const BM = await ethers.getContractFactory("BondMarketplace");
  const bm = await BM.deploy(
    paymentAddr,
    identityAddr,
    registryAddr,
    deployer.address
  );

  await bm.waitForDeployment();

  const marketAddr = await bm.getAddress();
  console.log("Bond Marketplace:", marketAddr);

  // Authorize marketplace for token escrow
  console.log("\n[Setup] Authorizing marketplace...");

  await (await bt.setTrustedContract(marketAddr, true)).wait();

  console.log("Marketplace authorized for escrow");

  // 7. Deploy CouponManager
  console.log("\n[7/7] Deploying CouponManager...");

  const CM = await ethers.getContractFactory("CouponManager");
  const cm = await CM.deploy(
    BOND_ID,
    paymentAddr,
    tokenAddr,
    identityAddr,
    registryAddr,
    deployer.address
  );

  await cm.waitForDeployment();

  const couponAddr = await cm.getAddress();
  console.log("Coupon Manager:", couponAddr);

  // Grant required roles
  console.log("\n[Setup] Granting contract roles...");

  const MINTER_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("MINTER_ROLE")
  );

  const BURNER_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("BURNER_ROLE")
  );

  await (await bt.grantRole(MINTER_ROLE, deployer.address)).wait();
  await (await bt.grantRole(BURNER_ROLE, couponAddr)).wait();

  console.log("MINTER_ROLE granted to deployer");
  console.log("BURNER_ROLE granted to CouponManager");

  // Register sample bond
  console.log("\n[Setup] Registering sample bond...");

  const faceValue = ethers.parseUnits("10000000", 18);
  const tokenPrice = ethers.parseUnits("1000", 18);

  const maturity =
    Math.floor(Date.now() / 1000) + 3 * 365 * 24 * 60 * 60;

  await (
    await bar.registerBond(
      BOND_ID,
      "Government Infrastructure Bond",
      "3-year government infrastructure bond. Face value Rs. 1 crore, 8% annual coupon, 10,000 tokens at Rs. 1,000.",
      faceValue,
      800,
      maturity,
      tokenPrice,
      10_000
    )
  ).wait();

  await (await bar.approveBond(BOND_ID)).wait();

  await (
    await rv.reportReserve(BOND_ID, faceValue, faceValue)
  ).wait();

  await (await rv.verifyReserve(BOND_ID)).wait();

  console.log("Sample bond registered and approved");
  console.log("Reserve successfully verified");

  // Save deployment information
  console.log("\n[Setup] Saving deployment addresses...");

  const deployment = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),

    contracts: {
      MockPaymentToken: paymentAddr,
      InvestorIdentity: identityAddr,
      BondAssetRegistry: registryAddr,
      ReserveVerifier: reserveAddr,
      BondToken: tokenAddr,
      BondMarketplace: marketAddr,
      CouponManager: couponAddr
    },

    sampleBond: {
      bondId: BOND_ID,
      name: "Government Infrastructure Bond",
      faceValue: "10000000 mINR",
      couponRate: "8% (800 bps)",
      maturityDate: new Date(maturity * 1000).toISOString(),
      totalSupply: 10000,
      tokenPrice: "1000 mINR"
    }
  };

  const deploymentDir = path.join(__dirname, "..", "deployments");

  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentDir, `deployment-${network.name}-${Date.now()}.json`),
    JSON.stringify(deployment, null, 2)
  );

  fs.writeFileSync(
    path.join(deploymentDir, "latest.json"),
    JSON.stringify(deployment, null, 2)
  );

  // Final deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("       PROPХ DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));

  console.log("\nContract Addresses:");
  console.log(JSON.stringify(deployment.contracts, null, 2));

  console.log("\nSaved to:");
  console.log("blockchain/deployments/latest.json");

  console.log("\nAll 7 contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nDEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  });
