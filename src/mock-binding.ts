/* External Imports */
import bre from '@nomiclabs/buidler'
import { ethers } from 'ethers'

/* Internal Imports */
import { toHexString, fromHexString } from './utils/buffer-utils'
import { MockContract, MockContractFunction } from './mock-contract.types'
import { sanitizeMockContractFunction } from './mock-generation'

/**
 * Binds logic to the buidler node that checks for calls to mock contracts and
 * replaces return values. Runs once as to avoid repeatedly hijacking functions
 * for each new mock contract.
 */
export const bindMockWatcherToVM = (): void => {
  const node = bre.network.provider['_node' as any]

  // No need to bind here if we've already done so.
  if (node.__calls) {
    return
  }

  const vmTracer = node['_vmTracer' as any]
  const vm = node['_vm' as any]

  // Set up some things we'll need for later.
  let txid: string
  let messages: Array<{
    address: string
    sighash: string
    calldata: string
  }> = []
  node.__calls = {}
  node.__contracts = {}

  // Modify the vm.runTx function to capture an ID for each transaction.
  const originalRunTx = vm.runTx.bind(vm)
  const modifiedRunTx = async (opts: any): Promise<any> => {
    // Buidler runs transactions multiple times (e.g., for gas estimation).
    // Here we're computing a unique ID for each transaction (based on sender,
    // nonce, and transaction data) so that we don't log calls multiple times.
    txid = ethers.utils.keccak256(
      '0x' +
        opts.tx._from.toString('hex') +
        opts.tx.nonce.toString('hex') +
        opts.tx.data.toString('hex')
    )

    // Wipe the calls for this txid to avoid duplicate results.
    node.__calls[txid] = {}

    return originalRunTx(opts)
  }
  vm['runTx' as any] = modifiedRunTx.bind(vm)

  // Modify the pre-message handler to capture calldata.
  const originalBeforeMessageHandler = vmTracer['_beforeMessageHandler' as any]
  const modifiedBeforeMessageHandler = async (message: any, next: any) => {
    // We only care about capturing if we're sending to one of our mocks.
    const address = message.to
      ? toHexString(message.to).toLowerCase()
      : undefined
    if (address && node.__contracts[address]) {
      const sighash = toHexString(message.data.slice(0, 4))
      const calldata = toHexString(message.data.slice(4))

      // Store the message for use in the post-message handler.
      messages.push({
        address,
        sighash,
        calldata,
      })

      // Basic existence checks.
      if (!node.__calls[txid][address]) {
        node.__calls[txid][address] = {}
      }
      if (!node.__calls[txid][address][sighash]) {
        node.__calls[txid][address][sighash] = []
      }

      // Add the data to the per-sighash array.
      node.__calls[txid][address][sighash].push(toHexString(message.data))
    }

    originalBeforeMessageHandler(message, next)
  }

  // Modify the post-message handler to insert the correct return data.
  const originalAfterMessageHandler = vmTracer['_afterMessageHandler' as any]
  const modifiedAfterMessageHandler = async (result: any, next: any) => {
    // We don't need to do anything if we haven't stored any mock messages.
    if (messages.length > 0) {
      // We need to look at the messages backwards since the first result will
      // correspond to the last message on the stack.
      const message = messages.pop()

      const contract = node.__contracts[message.address]
      const fn: MockContractFunction = contract.__fns[message.sighash]

      // Compute our return values.
      const inputParams = ethers.utils.defaultAbiCoder.decode(
        fn.inputTypes,
        message.calldata
      )
      const returnValues = Array.isArray(fn.returnValues)
        ? fn.returnValues
        : fn.returnValues(...inputParams)
      const returnBuffer = fromHexString(
        ethers.utils.defaultAbiCoder.encode(fn.outputTypes, returnValues)
      )

      // Set the return value to match our computed value.
      result.execResult.returnValue = returnBuffer
    }

    originalAfterMessageHandler(result, next)
  }

  // Disable tracing to remove the old handlers before adding new ones.
  vmTracer.disableTracing()
  vmTracer['_beforeMessageHandler' as any] = modifiedBeforeMessageHandler.bind(
    vmTracer
  )
  vmTracer['_afterMessageHandler' as any] = modifiedAfterMessageHandler.bind(
    vmTracer
  )
  vmTracer.enableTracing()
}

/**
 * Binds a mock contract to the VM and inserts necessary functions.
 * @param mock Mock contract to bind.
 * @param fns Contract functions associated with the mock.
 */
export const bindMockContractToVM = (
  mock: MockContract,
  fns: MockContractFunction[]
): void => {
  const node = bre.network.provider['_node' as any]
  node.__contracts[mock.address.toLowerCase()] = mock

  const getCalls = (functionName: string): string[] => {
    const calls: {
      [sighash: string]: string[]
    } = {}

    for (const txid of Object.keys(node.__calls)) {
      for (const address of Object.keys(node.__calls[txid])) {
        if (address === mock.address.toLowerCase()) {
          for (const sighash of Object.keys(node.__calls[txid][address])) {
            const txcalls = node.__calls[txid][address][sighash]
            calls[sighash] = calls[sighash]
              ? calls[sighash].concat(txcalls)
              : txcalls
          }
        }
      }
    }

    const sighash = mock.interface.getSighash(functionName)
    return calls[sighash] || []
  }

  ;(mock as any).getCallCount = (functionName: string): number => {
    return getCalls(functionName).length
  }
  ;(mock as any).getCallData = (
    functionName: string,
    callIndex: number
  ): any[] => {
    const calls = getCalls(functionName)
    if (calls.length <= callIndex) {
      throw new Error('Provided function call index does not exist.')
    }

    return mock.interface
      .decodeFunctionData(functionName, calls[callIndex])
      .map((element) => {
        return element
      })
  }
  ;(mock as any).setReturnValues = (
    functionName: string,
    returnValues: any[] | ((...params: any[]) => any[])
  ): void => {
    mock.__fns[
      mock.interface.getSighash(functionName)
    ].returnValues = returnValues
  }
  ;(mock as any).__fns = fns.reduce((fnmap, fn) => {
    fnmap[mock.interface.getSighash(fn.functionName)] = fn
    return fnmap
  }, {})
}
