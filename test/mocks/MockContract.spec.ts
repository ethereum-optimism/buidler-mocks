import { expect } from '../setup'

/* External Imports */
import { ethers } from '@nomiclabs/buidler'
import { Signer, ContractFactory, Contract } from 'ethers'

/* Internal Imports */
import { getMockContract, MockContract } from '../../src'

const NON_ZERO_ADDRESS = '0x' + '11'.repeat(20)
const abi = ethers.utils.defaultAbiCoder

describe('MockContract', () => {
  let signer: Signer
  before(async () => {
    ;[signer] = await ethers.getSigners()
  })

  let Factory__MockCaller: ContractFactory
  let Factory__SimpleStorage: ContractFactory
  before(async () => {
    Factory__MockCaller = await ethers.getContractFactory('MockCaller')
    Factory__SimpleStorage = await ethers.getContractFactory('SimpleStorage')
  })

  let MockCaller: Contract
  let SimpleStorage: Contract
  beforeEach(async () => {
    MockCaller = await Factory__MockCaller.deploy()
    SimpleStorage = await Factory__SimpleStorage.deploy()
  })

  describe('functions', () => {
    describe('fixed return spec', () => {
      it('should be able to return a fixed value with no inputs', async () => {
        const MockContract = await getMockContract(
          [
            {
              functionName: 'someFunction',
              inputTypes: [],
              outputTypes: ['address'],
              returnValues: [NON_ZERO_ADDRESS],
            },
          ],
          signer
        )

        const calldata = MockContract.interface.encodeFunctionData(
          'someFunction'
        )

        await MockCaller.callMock(MockContract.address, calldata)

        expect(await MockCaller.returndata()).to.equal(
          abi.encode(['address'], [NON_ZERO_ADDRESS])
        )
      })

      it('should be able to return a fixed value with inputs', async () => {
        const MockContract = await getMockContract(
          [
            {
              functionName: 'someFunction',
              inputTypes: ['uint256'],
              outputTypes: ['address'],
              returnValues: [NON_ZERO_ADDRESS],
            },
          ],
          signer
        )

        const calldata = MockContract.interface.encodeFunctionData(
          'someFunction',
          [1234]
        )

        await MockCaller.callMock(MockContract.address, calldata)

        expect(await MockCaller.returndata()).to.equal(
          abi.encode(['address'], [NON_ZERO_ADDRESS])
        )
      })
    })

    describe('dynamic return spec', () => {
      it('should be able to return a dynamic value with no inputs', async () => {
        let timestamp: number
        const MockContract = await getMockContract(
          [
            {
              functionName: 'someFunction',
              inputTypes: [],
              outputTypes: ['uint256'],
              returnValues: () => {
                timestamp = Date.now()
                return [timestamp]
              },
            },
          ],
          signer
        )

        const calldata = MockContract.interface.encodeFunctionData(
          'someFunction'
        )

        await MockCaller.callMock(MockContract.address, calldata)

        expect(await MockCaller.returndata()).to.equal(
          abi.encode(['uint256'], [timestamp])
        )
      })

      it('should be able to return a dynamic value with inputs', async () => {
        const MockContract = await getMockContract(
          [
            {
              functionName: 'someFunction',
              inputTypes: ['uint256'],
              outputTypes: ['uint256'],
              returnValues: (timestamp: number) => {
                return [timestamp]
              },
            },
          ],
          signer
        )

        const timestamp = Date.now()
        const calldata = MockContract.interface.encodeFunctionData(
          'someFunction',
          [timestamp]
        )

        await MockCaller.callMock(MockContract.address, calldata)

        expect(await MockCaller.returndata()).to.equal(
          abi.encode(['uint256'], [timestamp])
        )
      })
    })

    describe('contract spec', () => {
      it('should return default values', async () => {
        const MockContract = await getMockContract(SimpleStorage, signer)

        const calldata = MockContract.interface.encodeFunctionData('getStorage')

        await MockCaller.callMock(MockContract.address, calldata)

        expect(await MockCaller.returndata()).to.equal('0x' + '00'.repeat(32))
      })
    })

    describe('contract factory spec', () => {
      it('should return default values', async () => {
        const MockContract = await getMockContract(
          Factory__SimpleStorage,
          signer
        )

        const calldata = MockContract.interface.encodeFunctionData('getStorage')

        await MockCaller.callMock(MockContract.address, calldata)

        expect(await MockCaller.returndata()).to.equal('0x' + '00'.repeat(32))
      })
    })
  })

  describe('getCallCount', () => {
    let MockContract: MockContract
    beforeEach(async () => {
      MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: [],
            outputTypes: ['address'],
            returnValues: [NON_ZERO_ADDRESS],
          },
          {
            functionName: 'secondFunction',
            inputTypes: [],
            outputTypes: ['address'],
            returnValues: [NON_ZERO_ADDRESS],
          },
        ],
        signer
      )
    })

    it('should return zero when the specified function was not called', async () => {
      expect(MockContract.getCallCount('firstFunction')).to.equal(0)
    })

    it('should return one when called a single time', async () => {
      const calldata = MockContract.interface.encodeFunctionData(
        'firstFunction'
      )

      await MockCaller.callMock(MockContract.address, calldata)

      expect(MockContract.getCallCount('firstFunction')).to.equal(1)
    })

    it('should return the call count when called multiple times', async () => {
      const calldata = MockContract.interface.encodeFunctionData(
        'firstFunction'
      )

      for (let i = 0; i < 10; i++) {
        await MockCaller.callMock(MockContract.address, calldata)
      }

      expect(MockContract.getCallCount('firstFunction')).to.equal(10)
    })

    it('should return counts when multiple functions are called', async () => {
      const firstCalldata = MockContract.interface.encodeFunctionData(
        'firstFunction'
      )
      const secondCalldata = MockContract.interface.encodeFunctionData(
        'secondFunction'
      )

      for (let i = 0; i < 10; i++) {
        await MockCaller.callMock(MockContract.address, firstCalldata)
        await MockCaller.callMock(MockContract.address, secondCalldata)
      }

      expect(MockContract.getCallCount('firstFunction')).to.equal(10)
      expect(MockContract.getCallCount('secondFunction')).to.equal(10)
    })
  })

  describe('getCallData', () => {
    let MockContract: MockContract
    beforeEach(async () => {
      MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: ['address'],
            outputTypes: [],
            returnValues: [],
          },
        ],
        signer
      )
    })

    it('should return the data for a specific call', async () => {
      const calldata = MockContract.interface.encodeFunctionData(
        'firstFunction',
        [NON_ZERO_ADDRESS]
      )

      await MockCaller.callMock(MockContract.address, calldata)

      expect(MockContract.getCallData('firstFunction', 0)).to.deep.equal([
        NON_ZERO_ADDRESS,
      ])
    })

    it('should return data for multiple calls', async () => {
      const calldata = MockContract.interface.encodeFunctionData(
        'firstFunction',
        [NON_ZERO_ADDRESS]
      )

      for (let i = 0; i < 10; i++) {
        await MockCaller.callMock(MockContract.address, calldata)
      }

      for (let i = 0; i < 10; i++) {
        expect(MockContract.getCallData('firstFunction', i)).to.deep.equal([
          NON_ZERO_ADDRESS,
        ])
      }
    })

    it('should throw an error if a given call was not made', async () => {
      expect(() => {
        MockContract.getCallData('firstFunction', 0)
      }).to.throw('Provided function call index does not exist.')
    })
  })

  describe('setReturnValues', () => {
    it('should allow a function to be overwritten', async () => {
      const MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: [],
            outputTypes: ['uint256'],
            returnValues: [1234],
          },
        ],
        signer
      )

      const firstCalldata = MockContract.interface.encodeFunctionData(
        'firstFunction'
      )

      await MockCaller.callMock(MockContract.address, firstCalldata)

      expect(await MockCaller.returndata()).to.equal(
        abi.encode(['uint256'], [1234])
      )

      MockContract.setReturnValues('firstFunction', [5678])

      const secondCalldata = MockContract.interface.encodeFunctionData(
        'firstFunction'
      )

      await MockCaller.callMock(MockContract.address, secondCalldata)

      expect(await MockCaller.returndata()).to.equal(
        abi.encode(['uint256'], [5678])
      )
    })
  })
})
