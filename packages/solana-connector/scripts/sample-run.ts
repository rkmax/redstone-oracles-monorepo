import {
  fetchChainConfigs,
  getChainConfigByChainId,
} from "@redstone-finance/chain-configs";
import {
  ContractParamsProvider,
  getSignersForDataServiceId,
  sampleRun,
} from "@redstone-finance/sdk";
import "dotenv/config";
import { hexlify } from "ethers/lib/utils";
import _ from "lodash";
import {
  CLUSTER_NAMES,
  readCluster,
  SolanaConnectionBuilder,
  SolanaContractConnector,
} from "../src";
import { RDS_PROGRAM_ADDRESS } from "./consts";
import { readKeypair } from "./utils";

async function main() {
  const keypair = readKeypair();
  console.log("Public key:", hexlify(keypair.publicKey.toBytes()));

  const rpcUrls = getChainConfigByChainId(
    await fetchChainConfigs(),
    Number(_.findKey(CLUSTER_NAMES, (c) => c === readCluster())!),
    "solana"
  ).publicRpcUrls;
  const connection = new SolanaConnectionBuilder().withRpcUrls(rpcUrls).build();

  const paramsProvider = new ContractParamsProvider({
    dataPackagesIds: ["ETH", "BTC"],
    dataServiceId: "redstone-primary-prod",
    uniqueSignersCount: 3,
    authorizedSigners: getSignersForDataServiceId("redstone-primary-prod"),
  });

  const solanaContractConnector = new SolanaContractConnector(
    connection,
    RDS_PROGRAM_ADDRESS,
    keypair
  );

  await sampleRun(paramsProvider, solanaContractConnector);
}

void main();
