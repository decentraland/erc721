#pragma solidity ^0.4.18

import StandardAssetRegistry from './StandardAssetRegistry';
import EnumerableRegistry from './EnumerableRegistry';
import MetadataRegistry from './MetadataRegistry';

contract FullAssetRegistry is StandardAssetRegistry, EnumerableRegistry, MetadataRegistry {

    function FullAssetRegistry() {
        initialize();
    }

    function initialize() public {
        _supported165[interfaceID] = true;
        _supported165[erc165] = true;
    }
}
