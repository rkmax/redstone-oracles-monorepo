import { MathUtils, RedstoneCommon } from "@redstone-finance/utils";
import { Contract, ethers } from "ethers";
import { ProviderWithAgreement } from "../providers/ProviderWithAgreement";
import { ProviderWithFallback } from "../providers/ProviderWithFallback";
import { isEthersError } from "../common";

export interface TxBroadcaster {
  broadcast(signedTx: string): Promise<ethers.providers.TransactionResponse>;
  fetchNonce(): Promise<number>;
}

const BROADCAST_TIMEOUT = 10_000;
const NONCE_TIMEOUT = 5_000;
const FETCH_NONCE_RETRIES = 3;

const logger = (text: string) =>
  console.log(`[${MultiNodeTxBroadcaster.name}] ${text}`);

export class MultiNodeTxBroadcaster implements TxBroadcaster {
  private readonly providers: readonly ethers.providers.Provider[];
  private readonly signer: ethers.Signer;

  constructor(contract: Contract) {
    this.providers = MultiNodeTxBroadcaster.extractProviders(contract.provider);
    this.signer = contract.signer;
  }

  /**
   *  Get aggregated nonce from all providers
   * @param numberOfTheTry - this internal parameter used with recursion to track retry number. Don't touch!
   */
  async fetchNonce(numberOfTheTry: number = 1): Promise<number> {
    const address = await this.signer.getAddress();

    const maybeNonces = await Promise.allSettled(
      this.providers.map((p) =>
        RedstoneCommon.timeout(p.getTransactionCount(address), NONCE_TIMEOUT)
      )
    );

    const nonces = maybeNonces
      .filter((maybeNonce) => maybeNonce.status === "fulfilled")
      .map((n) => (n as PromiseFulfilledResult<number>).value);

    if (nonces.length === 0 && numberOfTheTry !== FETCH_NONCE_RETRIES) {
      logger(
        `Failed to fetch at least one nonce. Retrying attempt ${numberOfTheTry}/${FETCH_NONCE_RETRIES}`
      );
      return await this.fetchNonce(numberOfTheTry + 1);
    }

    if (!nonces.every((nonce, _, allNonces) => nonce === allNonces[0])) {
      logger(
        `Not all nonces returned by providers are equal. Nonces: ${nonces.join(
          ","
        )}`
      );
    }

    const { representativeGroup, outliers } = MathUtils.filterOutliers(
      nonces,
      10
    );

    if (outliers.length > 0) {
      logger(
        `${
          outliers.length
        } providers returned outlier nonce. Nonces: ${nonces.join(",")}`
      );
    }

    return Math.max(...representativeGroup);
  }

  /**
   * Broadcast transaction to every provider
   * Resolves when at least one broadcast resolve
   */
  async broadcast(
    signedTx: string
  ): Promise<ethers.providers.TransactionResponse> {
    const broadcastTx = async (provider: ethers.providers.Provider) => {
      try {
        const sendTxPromise = provider.sendTransaction(signedTx);
        return await RedstoneCommon.timeout(sendTxPromise, BROADCAST_TIMEOUT);
      } catch (e) {
        const rpcUrl = getRpcUrl(provider);
        (e as { rpcUrl: string }).rpcUrl = rpcUrl;

        throw new Error(
          `provider ${rpcUrl}: failed to broadcast tx: ${MultiNodeTxBroadcaster.stringifyBroadcastError(
            e
          )}`
        );
      }
    };

    const broadcastPromises = this.providers.map(broadcastTx);

    return await Promise.any(broadcastPromises);
  }

  static stringifyBroadcastError(e: unknown) {
    if (isEthersError(e)) {
      return `code=${e.code} message=${e.message}`;
    }
    return RedstoneCommon.stringifyError(e);
  }

  static extractProviders<T extends ethers.providers.Provider>(
    provider: T
  ): readonly ethers.providers.Provider[] {
    if (
      provider instanceof ProviderWithFallback ||
      provider instanceof ProviderWithAgreement
    ) {
      return provider.providers;
    }
    return [provider];
  }
}

const getRpcUrl = (provider: ethers.providers.Provider) => {
  try {
    return (provider as ethers.providers.JsonRpcProvider).connection.url;
  } catch (e) {
    return "rpc_url_unknown";
  }
};