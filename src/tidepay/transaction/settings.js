'use strict'; // eslint-disable-line strict

var _ = require('lodash');
var assert = require('assert');
var BigNumber = require('bignumber.js');
var utils = require('./utils');
var validate = utils.common.validate;
var AccountFlagIndices = utils.common.constants.AccountFlagIndices;
var AccountFields = utils.common.constants.AccountFields;


// Emptry string passed to setting will clear it
var CLEAR_SETTING = null;

function setTransactionFlags(txJSON, values) {
  var keys = Object.keys(values);
  assert(keys.length === 1, 'ERROR: can only set one setting per transaction');
  var flagName = keys[0];
  var value = values[flagName];
  var index = AccountFlagIndices[flagName];
  if (index !== undefined) {
    if (value) {
      txJSON.SetFlag = index;
    } else {
      txJSON.ClearFlag = index;
    }
  }
}

function setTransactionFields(txJSON, input) {
  var fieldSchema = AccountFields;
  for (var fieldName in fieldSchema) {
    var field = fieldSchema[fieldName];
    var value = input[field.name];

    if (value === undefined) {
      continue;
    }

    // The value required to clear an account root field varies
    if (value === CLEAR_SETTING && field.hasOwnProperty('defaults')) {
      value = field.defaults;
    }

    if (field.encoding === 'hex' && !field.length) {
      // This is currently only used for Domain field
      value = new Buffer(value, 'ascii').toString('hex').toUpperCase();
    }

    txJSON[fieldName] = value;
  }
}

/**
 *  Note: A fee of 1% requires 101% of the destination to be sent for the
 *        destination to receive 100%.
 *  The transfer rate is specified as the input amount as fraction of 1.
 *  To specify the default rate of 0%, a 100% input amount, specify 1.
 *  To specify a rate of 1%, a 101% input amount, specify 1.01
 *
 *  @param {Number|String} transferRate
 *
 *  @returns {Number|String} numbers will be converted while strings
 *                           are returned
 */

function convertTransferRate(transferRate) {
  return new BigNumber(transferRate).shift(9).toNumber();
}

function formatSignerEntry(signer) {
  return {
    SignerEntry: {
      Account: signer.address,
      SignerWeight: signer.weight
    }
  };
}

function createSettingsTransactionWithoutMemos(account, settings) {
  if (settings.regularKey !== undefined) {
    var removeRegularKey = {
      TransactionType: 'SetRegularKey',
      Account: account
    };
    if (settings.regularKey === null) {
      return removeRegularKey;
    }
    return _.assign({}, removeRegularKey, { RegularKey: settings.regularKey });
  }

  if (settings.signers !== undefined) {
    return {
      TransactionType: 'SignerListSet',
      Account: account,
      SignerQuorum: settings.signers.threshold,
      SignerEntries: _.map(settings.signers.weights, formatSignerEntry)
    };
  }

  var txJSON = {
    TransactionType: 'AccountSet',
    Account: account
  };

  setTransactionFlags(txJSON, _.omit(settings, 'memos'));
  setTransactionFields(txJSON, settings);

  if (txJSON.TransferRate !== undefined) {
    txJSON.TransferRate = convertTransferRate(txJSON.TransferRate);
  }
  return txJSON;
}

function createSettingsTransaction(account, settings) {
  var txJSON = createSettingsTransactionWithoutMemos(account, settings);
  if (settings.memos !== undefined) {
    txJSON.Memos = _.map(settings.memos, utils.convertMemo);
  }
  return txJSON;
}

function prepareSettings(address, settings) {
  var instructions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  validate.prepareSettings({ address: address, settings: settings, instructions: instructions });
  var txJSON = createSettingsTransaction(address, settings);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = prepareSettings;