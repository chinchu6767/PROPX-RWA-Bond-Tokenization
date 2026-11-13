import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * setupDemo.ts
 * Reads the latest deployment addresses and sets up a complete demo state:
 *   - Mints mINR to test accounts
 *   - Registers and approves test investor wallets
 *   - Mints bond tokens to investors
 *   - Creates a marketplace listing
 */
async function main() {
  const latestPath = path.join(__dirname, "..", "deployments", "latest.json");
  if (!fs.existsSync(latestPath)) {
    throw new Error("No latest.json deployment found. Run deploy.ts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  const { contracts } = deployment;

  const [deployer, investor1, investor2] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("  Propx – Demo Setup");
  console.log("=".repeat(60));
  console.log("Deployer :", deployer.address);
  console.log("Investor1:", investor1.address);
  console.log("Investor2:", investor2.address);

  const mpt = await ethers.getContractAt("MockPaymentToken", contracts.MockPaymentToken);
  const ii  = await ethers.getContractAt("InvestorIdentity",  contracts.InvestorIdentity);
  const bt  = await ethers.getContractAt("BondToken",         contracts.BondToken);
  const bm  = await ethers.getContractAt("BondMarketplace",   contracts.BondMarketplace);

  // Fund investors with mINR
  const mintAmount = ethers.parseUnits("5000000", 18); // 5M mINR each
  await mpt.mint(investor1.address, mintAmount);
  await mpt.mint(investor2.address, mintAmount);
  console.log("\n✓ Minted 5,000,000 mINR to investor1 and investor2");

  // Register & approve investors
  await ii.connect(investor1).registerInvestor();
  await ii.approveInvestor(investor1.address, ethers.ZeroHash);
  await ii.connect(investor2).registerInvestor();
  await ii.approveInvestor(investor2.address, ethers.ZeroHash);
  console.log("✓ Investor1 and Investor2 KYC-approved");

  // Mint bond tokens to investor1 (100 tokens)
  await bt.mint(investor1.address, 100);
  console.log("✓ Minted 100 PGIB tokens to investor1");

  // Create marketplace listing from investor1 (sell 20 tokens at ₹1,100 each)
  const tokenAddr   = contracts.BondToken;
  const marketAddr  = contracts.BondMarketplace;
  const listingPrice = ethers.parseUnits("1100", 18);
  await bt.connect(investor1).approve(marketAddr, 20);
  await bm.connect(investor1).createListing(tokenAddr, "BOND001", 20, listingPrice, 7 * 24 * 3600);
  console.log("✓ Investor1 listed 20 tokens at ₹1,100 each");

  console.log("\n" + "=".repeat(60));
  console.log("DEMO SETUP COMPLETE");
  console.log("=".repeat(60));
  console.log("investor1 mINR :", ethers.formatUnits(await mpt.balanceOf(investor1.address), 18));
  console.log("investor1 PGIB :", (await bt.balanceOf(investor1.address)).toString());
  console.log("investor2 mINR :", ethers.formatUnits(await mpt.balanceOf(investor2.address), 18));
  console.log("Active listings:", (await bm.getActiveListings()).length.toString());
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

