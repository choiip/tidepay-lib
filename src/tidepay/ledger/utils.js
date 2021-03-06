'use strict'; // eslint-disable-line strict

var _ = require('lodash');
var assert = require('assert');
var common = require('../common');
var dropsToXrp = common.dropsToXrp;


function clamp(value, min, max) {
  assert(min <= max, 'Illegal clamp bounds');
  return Math.min(Math.max(value, min), max);
}

function getXRPBalance(api, address, ledgerVersion) {
  var request = {
    account: address,
    ledger_index: ledgerVersion
  };
  return api.doAccountInfo(request).then(function (data) {
    return dropsToXrp(data.account_data.Balance);
  });
}

// If the marker is omitted from a response, you have reached the end
function getRecursiveRecur(getter, marker, limit) {
  return getter(marker, limit).then(function (data) {
    var remaining = limit - data.results.length;
    if (remaining > 0 && data.marker !== undefined) {
      return getRecursiveRecur(getter, data.marker, remaining).then(function (results) {
        return data.results.concat(results);
      });
    }
    return data.results.slice(0, limit);
  });
}

function getRecursive(getter, limit) {
  return getRecursiveRecur(getter, undefined, limit || Infinity);
}

function renameCounterpartyToIssuer(amount) {
  if (amount === undefined) {
    return undefined;
  }
  var issuer = amount.counterparty === undefined ? amount.issuer !== undefined ? amount.issuer : undefined : amount.counterparty;
  var withIssuer = _.assign({}, amount, { issuer: issuer });
  return _.omit(withIssuer, 'counterparty');
}

function renameCounterpartyToIssuerInOrder(order) {
  var taker_gets = renameCounterpartyToIssuer(order.taker_gets);
  var taker_pays = renameCounterpartyToIssuer(order.taker_pays);
  var changes = { taker_gets: taker_gets, taker_pays: taker_pays };
  return _.assign({}, order, _.omit(changes, _.isUndefined));
}

function signum(num) {
  return num === 0 ? 0 : num > 0 ? 1 : -1;
}

/**
 *  Order two rippled transactions based on their ledger_index.
 *  If two transactions took place in the same ledger, sort
 *  them based on TransactionIndex
 *  See: https://ripple.com/build/transactions/
 *
 *  @param {Object} first
 *  @param {Object} second
 *  @returns {Number} [-1, 0, 1]
 */

function compareTransactions(first, second) {
  if (!first.outcome || !second.outcome) {
    return 0;
  }
  if (first.outcome.ledgerVersion === second.outcome.ledgerVersion) {
    return signum(first.outcome.indexInLedger - second.outcome.indexInLedger);
  }
  return first.outcome.ledgerVersion < second.outcome.ledgerVersion ? -1 : 1;
}

function hasCompleteLedgerRange(api, minLedgerVersion, maxLedgerVersion) {
  var firstLedgerVersion = 32570; // earlier versions have been lost
  return api.hasLedgerVersions(minLedgerVersion || firstLedgerVersion, maxLedgerVersion);
}

function isPendingLedgerVersion(api, maxLedgerVersion) {
  return api.getLedgerVersion().then(function (ledgerVersion) {
    return ledgerVersion < (maxLedgerVersion || 0);
  });
}

function ensureLedgerVersion(options) {
  if (Boolean(options) && options.ledgerVersion !== undefined && options.ledgerVersion !== null) {
    return Promise.resolve(options);
  }
  return this.getLedgerVersion().then(function (ledgerVersion) {
    return _.assign({}, options, { ledgerVersion: ledgerVersion });
  });
}

module.exports = {
  getXRPBalance: getXRPBalance,
  ensureLedgerVersion: ensureLedgerVersion,
  compareTransactions: compareTransactions,
  renameCounterpartyToIssuerInOrder: renameCounterpartyToIssuerInOrder,
  getRecursive: getRecursive,
  hasCompleteLedgerRange: hasCompleteLedgerRange,
  isPendingLedgerVersion: isPendingLedgerVersion,
  clamp: clamp,
  common: common
};