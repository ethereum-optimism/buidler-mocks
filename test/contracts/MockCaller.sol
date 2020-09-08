// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

contract MockCaller {
    bytes public returndata;

    function callMock(
        address _target,
        bytes memory _calldata
    )
        public
    {
        (bool success, bytes memory result) = _target.call(_calldata);
        if (!success) {
            revert(string(result));
        } else {
            returndata = result;
        }
    }
}
