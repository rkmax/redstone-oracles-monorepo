import { RpcUrlsPerChain } from "../../scripts/read-ssm-rpc-urls";
import { getLocalChainConfigs } from "../../src";
import { validateRpcUrls } from "./common";

const validatePublicRpcUrls = () => {
  const chainConfigs = getLocalChainConfigs();
  const rpcUrlsPerChain: RpcUrlsPerChain = {};

  for (const { name, chainId, publicRpcUrls } of Object.values(chainConfigs)) {
    if (name === "hardhat") {
      continue;
    }
    rpcUrlsPerChain[name] = {
      chainId,
      rpcUrls: publicRpcUrls,
    };
  }

  validateRpcUrls(rpcUrlsPerChain);
};

describe("Chain Configs Rpc Urls Validation", function () {
  it("", function () {
    if (!process.env.TEST_RPC) {
      this.skip();
    }
    return validatePublicRpcUrls();
  });
});