import fs from 'fs';
import ts from 'typescript';

// Read and transpile the TypeScript file
const tsCode = fs.readFileSync('./utils/dataProcessor.ts', 'utf8');
const jsCode = ts.transpile(tsCode, { target: ts.ScriptTarget.ES2015, module: ts.ModuleKind.CommonJS });

// Create a module context
const module = { exports: {} };
const context = {
  module: module,
  exports: module.exports,
  console: console,
  Math: Math,
  Date: Date,
  Array: Array,
  Object: Object,
  Number: Number,
  String: String,
  Boolean: Boolean,
  RegExp: RegExp,
  JSON: JSON,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,
};

const script = new Function(...Object.keys(context), jsCode);
script(...Object.values(context));

const { generateTimeSeries, generatePredictions, lstmPredict } = module.exports;

console.log('LSTM Predictions Test:');
console.log('Last 5 historical data points:');
const timeSeries = generateTimeSeries();
timeSeries.slice(-5).forEach(d => console.log(d.date + ': Cases ' + d.cases + ', Deaths ' + d.deaths + ', Vaccinated ' + d.vaccinated));
console.log('\nFirst 5 predictions:');
const predictions = generatePredictions(timeSeries);
predictions.slice(0, 5).forEach(p => console.log(p.date + ': Predicted Cases ' + p.predictedCases + ', Deaths ' + p.predictedDeaths + ', Vaccinated ' + p.predictedVaccinated));
console.log('\nLast 5 predictions:');
predictions.slice(-5).forEach(p => console.log(p.date + ': Predicted Cases ' + p.predictedCases + ', Deaths ' + p.predictedDeaths + ', Vaccinated ' + p.predictedVaccinated));

// Test LSTM prediction function directly
console.log('\nDirect LSTM test with sample data:');
const sampleData = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190];
const lstmPredictions = lstmPredict(sampleData, 5);
console.log('Sample input:', sampleData);
console.log('LSTM predictions:', lstmPredictions);
