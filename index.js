// This file exists for the Android release build bundler which runs from the monorepo root
// It re-exports the mobile app's entry point
module.exports = require('./apps/mobile/index.js');
