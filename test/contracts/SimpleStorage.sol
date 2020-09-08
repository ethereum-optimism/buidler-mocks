// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

contract SimpleStorage {
    mapping (bytes32 => bytes32) private database;

    function setStorage(
        bytes32 _key,
        bytes32 _value
    )
        public
    {
        database[_key] = _value;
    }

    function getStorage(
        bytes32 _key
    )
        public
        view
        returns (
            bytes32 _value
        )
    {
        return database[_key];
    }
}
