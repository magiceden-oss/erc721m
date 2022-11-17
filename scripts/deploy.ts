// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractDetails } from './common/constants';

export interface IDeployParams {
  name: string;
  symbol: string;
  tokenurisuffix: string;
  maxsupply: string;
  globalwalletlimit: string;
  cosigner?: string;
  timestampexpiryseconds?: number;
  increasesupply?: boolean;
}

export const deploy = async (
  args: IDeployParams,
  hre: HardhatRuntimeEnvironment,
) => {
  // Compile again in case we have a coverage build (binary too large to deploy)
  await hre.run('compile');

  const contractName = args.increasesupply
    ? ContractDetails.ERC721MIncreasableSupply.name
    : ContractDetails.ERC721M.name;
  console.log(
    `Going to deploy ${contractName} with params`,
    JSON.stringify(args, null, 2),
  );
  const ERC721M = await hre.ethers.getContractFactory(contractName);
  const deployArgs = [
    args.name,
    args.symbol,
    args.tokenurisuffix,
    hre.ethers.BigNumber.from(args.maxsupply),
    hre.ethers.BigNumber.from(args.globalwalletlimit),
    args.cosigner ?? hre.ethers.constants.AddressZero,
    args.timestampexpiryseconds ?? 300,
  ] as const;

  const deployTx = ERC721M.getDeployTransaction(...deployArgs);
  const gas = await hre.ethers.provider.estimateGas(deployTx);
  const gasPrice = await hre.ethers.provider.getGasPrice();
  console.log(
    'Deployment estimated cost (ETH):',
    hre.ethers.utils.formatEther(gas.mul(gasPrice)),
  );

  const erc721M = await ERC721M.deploy(...deployArgs);

  await erc721M.deployed();

  console.log(`${contractName} deployed to:`, erc721M.address);
};
