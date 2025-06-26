const fs = require('fs');
const path = require('path');

// Path to your model names text file
const modelNamesFile = '_model_names.txt';

// Read the list of model names
fs.readFile(modelNamesFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading model names file:', err);
    return;
  }

  const modelNames = data.split(/\r?\n/).filter(name => name.trim() !== '');

  // Read current directory files
  fs.readdir('.', (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    // For each model name, find matching files
    modelNames.forEach(modelName => {
      // Find files that match case-insensitively
      const matchingFiles = files.filter(file => file.toLowerCase() === modelName.toLowerCase());

      matchingFiles.forEach(file => {
        if (file !== modelName) {
          const oldPath = path.join('.', file);
          const newPath = path.join('.', modelName);

          // Rename the file to match the exact case of the model name
          fs.rename(oldPath, newPath, err => {
            if (err) {
              console.error(`Failed to rename ${file} to ${modelName}:`, err);
            } else {
              console.log(`Renamed "${file}" to "${modelName}"`);
            }
          });
        }
      });
    });
  });
});
