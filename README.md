# buidler-mocks
`buidler-mocks` is a utility package that can generate mock Solidity contracts for use within tests. `buidler-mocks` hooks into `buidler`'s internal virtual machine so that mock contract functions can be written entirely in JavaScript.

## Simple Example
```typescript
import { ethers } from '@nomiclabs/buidler'
import { getMockContract } from '@eth-optimism/buidler-mocks'

const [signer] = await ethers.getSigners()
const myMockContract = await getMockContract(
  [
    {
      functionName: 'myFunction',
      inputTypes: ['address', 'string memory'],
      outputTypes: ['uint256'],
      returnValues: (paramA: string, paramB: string) => {
        if (paramA === '0x0000000000000000000000000000000000000000') {
          return [1234]
        } else if (paramB === 'Hello!') {
          return [5678]
        } else {
          return [12345678]
        }
      }
    }
  ]
)
```

## API
### MockContractFunction
#### Interface
```typescript
interface MockContractFunction {
  functionName: string
  inputTypes?: string[]
  outputTypes?: string[]
  returnValues?: any[] | ((...params: any[]) => any[])
}
```

#### Description
`MockContractFunction` is the interface used to define functions for your mock contract object.

#### Properties
* `functionName`: Name for the function, will be used when the Solidity code for your contract is generated.
* `inputTypes`: Input types to the function (e.g., array of `address` or `string memory`).
* `outputTypes`: Output types returned by the function (same format as input types).
* `returnValues`: Values to be returned by the function. Either a fixed array of values, or a function that returns an array. Number of elements returned must match the number of output types.

### MockContract
#### Interface
```typescript
interface MockContract extends Contract {
  getCallCount: (functionName: string) => number
  getCallData: (functionName: string, callIndex: number) => any[]
  setReturnValues: (functionName: string, returnValues: any[] | ((...params: any[]) => any[])) => void
}
```

#### Description
`MockContract` is a type that extends the `ethers.Contract` object. It introduces several utility methods that can be used to access interactions with your mock contract.

#### Properties
* `getCallCount`: Returns the number of times a particular function was called.
* `getCallData`: Returns the calldata for a specific call to a given function.
* `setReturnValues`: Replaces the return values for a given function.

### getMockContract
#### Function Signature
```typescript
const getMockContract = async (
  spec: MockContractFunction[] | Contract | ContractFactory,
  signer: Signer,
  compiler?: SolidityCompiler
): Promise<MockContract>
```

#### Description
Generates and deploys a new `MockContract` instance.

#### Inputs
* `spec`: Specification for the mock contract. Can either be an array of `MockContractFuction` objects, an `ethers.Contract` object, or an `ethers.ContractFactory` object.
* `signer`: `ethers.Signer` to use to deploy the mock contract.
* `compiler`: Optional `solc` object to compile with. Otherwise will use the current `buidler` compiler within your project.

#### Outputs
* `MockContract`: Deployed `MockContract` instance.
