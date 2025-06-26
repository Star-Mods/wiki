const fs = require('fs');
const path = require('path');

// Directory containing JSON files
const directoryPath = './'; // Change this to your directory path
// Output file
const outputFile = './_model_names.txt';

// Read all files in the directory
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  const modelNames = [];

  // Filter JSON files
  const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');

  let processedCount = 0;

  jsonFiles.forEach(file => {
    const filePath = path.join(directoryPath, file);
    fs.readFile(filePath, 'utf8', (err, data) => {
      processedCount++;
      if (err) {
        console.error(`Error reading file ${file}:`, err);
      } else {
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.hasOwnProperty('Model')) {
            modelNames.push(jsonData['Model']);
          }
        } catch (parseErr) {
          console.error(`Error parsing JSON in file ${file}:`, parseErr);
        }
      }

      // After processing all files, write to output
      if (processedCount === jsonFiles.length) {
        fs.writeFile(outputFile, modelNames.join('\n'), err => {
          if (err) {
            console.error('Error writing to output file:', err);
          } else {
            console.log(`Extracted ${modelNames.length} model names to ${outputFile}`);
          }
        });
      }
    });
  });
});
