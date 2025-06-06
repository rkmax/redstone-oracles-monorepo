// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.17;

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

library DeviationLib {
  function calculateAbsDeviation(
    uint256 proposedValue,
    uint256 originalValue,
    uint256 precision
  ) internal pure returns (uint256) {
    int256 originalValueAsInt = SafeCast.toInt256(originalValue);
    return
      abs(
        ((SafeCast.toInt256(proposedValue) - originalValueAsInt) *
          100 *
          SafeCast.toInt256(precision)) / originalValueAsInt
      );
  }

  function abs(int256 x) private pure returns (uint256) {
    return SafeCast.toUint256(x >= 0 ? x : -x);
  }
}
