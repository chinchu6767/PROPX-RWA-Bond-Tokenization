console.log("GAS REPORT SCRIPT STARTED");
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  const [admin, investor1, investor2] = await ethers.getSigners();

  const bondId = "BOND001";
  const faceValue = ethers.parseUnits("10000000", 18);
  const tokenPrice = ethers.parseUnits("1000", 18);
  const totalSupply = 10000n;
  const couponBps = 800;
  const maturity = (await time.latest()) + 3 * 365 * 24 * 3600;

  async function deploy(name: string, args: any[] = []) {
    const contract = await (await ethers.getContractFactory(name)).deploy(...args);
    const receipt = await contract.deploymentTransaction()!.wait();
    console.log(`${name} deployment: ${receipt!.gasUsed} gas`);
    return contract;
  }

  async function measure(label: string, txPromise: Promise<any>) {
    const tx = await txPromise;
    const receipt = await tx.wait();
    console.log(`${label}: ${receipt!.gasUsed} gas`);
  }

  const mpt = await deploy("MockPaymentToken");
  const ii = await deploy("InvestorIdentity", [admin.address]);
  const bar = await deploy("BondAssetRegistry", [admin.address]);
  const rv = await deploy("ReserveVerifier", [admin.address]);

  const bt = await deploy("BondToken", [
    bondId, "Propx Gov Infra Bond Token", "PGIB",
    totalSupply, await bar.getAddress(), await ii.getAddress(),
    await rv.getAddress(), admin.address
  ]);

  const bm = await deploy("BondMarketplace", [
    await mpt.getAddress(), await ii.getAddress(),
    await bar.getAddress(), admin.address
  ]);

  await measure("Set trusted marketplace",
    bt.setTrustedContract(await bm.getAddress(), true));

  const cm = await deploy("CouponManager", [
    bondId, await mpt.getAddress(), await bt.getAddress(),
    await ii.getAddress(), await bar.getAddress(), admin.address
  ]);

  const minter = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const burner = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

  await measure("Grant minter role", bt.grantRole(minter, admin.address));
  await measure("Grant burner role", bt.grantRole(burner, await cm.getAddress()));

  await measure("registerBond()", bar.registerBond(
    bondId, "Gov Bond", "Desc", faceValue,
    couponBps, maturity, tokenPrice, totalSupply
  ));

  await measure("approveBond()", bar.approveBond(bondId));
  await measure("reportReserve()", rv.reportReserve(bondId, faceValue, faceValue));
  await measure("verifyReserve()", rv.verifyReserve(bondId));

  await measure("registerInvestor() - investor 1",
    ii.connect(investor1).registerInvestor());
  await measure("approveInvestor() - investor 1",
    ii.approveInvestor(investor1.address, ethers.ZeroHash));

  await measure("registerInvestor() - investor 2",
    ii.connect(investor2).registerInvestor());
  await measure("approveInvestor() - investor 2",
    ii.approveInvestor(investor2.address, ethers.ZeroHash));

  await measure("mint()", bt.mint(investor1.address, 100));
  await measure("transfer()",
    bt.connect(investor1).transfer(investor2.address, 10));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
