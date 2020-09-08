import { expect } from '../setup'

/* External Imports */
import { ethers } from '@nomiclabs/buidler'
import { Signer, ContractFactory, Contract } from 'ethers'

/* Internal Imports */
import { getMockContract } from '../../src'

describe('getMockContract', () => {
  let signer: Signer
  before(async () => {
    ;[signer] = await ethers.getSigners()
  })

  let Factory__SimpleStorage: ContractFactory
  let SimpleStorage: Contract
  before(async () => {
    Factory__SimpleStorage = await ethers.getContractFactory('SimpleStorage')
    SimpleStorage = await Factory__SimpleStorage.deploy()
  })

  describe('fixed return spec', () => {
    it('should generate a mock contract with no input or output types', async () => {
      const MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: [],
            outputTypes: [],
            returnValues: [],
          },
        ],
        signer
      )

      expect(typeof MockContract.firstFunction).to.equal('function')
    })

    it('should generate a mock contract with input types', async () => {
      const MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: ['uint256', 'string memory'],
            outputTypes: [],
            returnValues: [],
          },
        ],
        signer
      )

      expect(typeof MockContract.firstFunction).to.equal('function')
    })

    it('should generate a mock contract with output types', async () => {
      const MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: [],
            outputTypes: ['uint256', 'string memory'],
            returnValues: [1234, 'hello'],
          },
        ],
        signer
      )

      expect(typeof MockContract.firstFunction).to.equal('function')
    })

    it('should generate a mock contract with input and output types', async () => {
      const MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: ['uint256', 'string memory'],
            outputTypes: ['uint256', 'string memory'],
            returnValues: [1234, 'hello'],
          },
        ],
        signer
      )

      expect(typeof MockContract.firstFunction).to.equal('function')
    })

    it('should fail if the number of output types and return values are mismatched', async () => {
      await expect(
        getMockContract(
          [
            {
              functionName: 'firstFunction',
              inputTypes: [],
              outputTypes: ['uint256', 'string memory'],
              returnValues: [],
            },
          ],
          signer
        )
      ).to.be.rejectedWith(
        'Provided MockContract function is invalid. Please check your mock definition.'
      )
    })
  })

  describe('dynamic return spec', () => {
    it('should generate a mock contract with output types', async () => {
      const MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: [],
            outputTypes: ['uint256', 'string memory'],
            returnValues: () => {
              return [1234, 'hello']
            },
          },
        ],
        signer
      )

      expect(typeof MockContract.firstFunction).to.equal('function')
    })

    it('should generate a mock contract with input and output types', async () => {
      const MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: ['uint256', 'string memory'],
            outputTypes: ['uint256', 'string memory'],
            returnValues: (paramA: number, paramB: string) => {
              return [paramA, paramB]
            },
          },
        ],
        signer
      )

      expect(typeof MockContract.firstFunction).to.equal('function')
    })
  })

  it('mixed return spec', async () => {
    it('should generate a mock contract', async () => {
      const MockContract = await getMockContract(
        [
          {
            functionName: 'firstFunction',
            inputTypes: [],
            outputTypes: ['uint256', 'string memory'],
            returnValues: [1234, 'hello'],
          },
          {
            functionName: 'secondFunction',
            inputTypes: [],
            outputTypes: ['uint256', 'string memory'],
            returnValues: () => {
              return [1234, 'hello']
            },
          },
        ],
        signer
      )

      expect(typeof MockContract.firstFunction).to.equal('function')
      expect(typeof MockContract.secondFunction).to.equal('function')
    })
  })

  describe('contract spec', () => {
    it('should generate a mock contract', async () => {
      const MockContract = await getMockContract(SimpleStorage, signer)

      expect(typeof MockContract.setStorage).to.equal('function')
      expect(typeof MockContract.getStorage).to.equal('function')
    })
  })

  describe('contract factory spec', () => {
    it('should generate a mock contract', async () => {
      const MockContract = await getMockContract(Factory__SimpleStorage, signer)

      expect(typeof MockContract.setStorage).to.equal('function')
      expect(typeof MockContract.getStorage).to.equal('function')
    })
  })
})
