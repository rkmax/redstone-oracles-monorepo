import { NonEvmChainType } from "@redstone-finance/chain-configs";
import { z } from "zod";
import {
  AdapterType,
  AnyOnChainRelayerManifest,
  MULTI_FEED,
  MultiFeedAdapterTypesEnum,
  MultiFeedOnChainRelayerManifest,
  NonEvmAdapterType,
  NonEvmAdapterTypesEnum,
} from "./schemas";

export function isMultiFeedRelayerManifest(
  manifest: AnyOnChainRelayerManifest
): manifest is MultiFeedOnChainRelayerManifest {
  return isMultiFeedAdapterType(manifest.adapterContractType);
}

export function isMultiFeedAdapterType(
  adapterContractType: AdapterType
): adapterContractType is z.infer<typeof MultiFeedAdapterTypesEnum> {
  return MultiFeedAdapterTypesEnum.safeParse(adapterContractType).success;
}

export function isNonEvmAdapterType(
  adapterContractType?: AdapterType
): adapterContractType is NonEvmAdapterType {
  return NonEvmAdapterTypesEnum.safeParse(adapterContractType).success;
}

export function isNonEvmConfig(config: {
  adapterContractType: AdapterType;
}): config is { adapterContractType: NonEvmAdapterType } {
  return isNonEvmAdapterType(config.adapterContractType);
}

export function getChainType(adapterType?: AdapterType) {
  return isNonEvmAdapterType(adapterType)
    ? getNonEvmNetworkName(adapterType)
    : "evm";
}

export function getNonEvmNetworkName(adapterType: NonEvmAdapterType) {
  return adapterType.replace(`-${MULTI_FEED}`, "") as NonEvmChainType;
}
