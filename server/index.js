const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Securely load credentials from environment variable
let serviceAccountAuth;
try {
  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawCreds) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is missing');
  }
  let creds;
  try {
      creds = JSON.parse(rawCreds);
  } catch (parseError) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  
  serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
} catch (error) {
  console.error('FATAL: Failed to parse Google Service Account credentials:', error.message);
  process.exit(1);
}

const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);

app.post('/api/process', async (req, res) => {
  try {
    const { studentName, extractedData } = req.body;

    if (!process.env.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID environment variable is missing');
    }

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[studentName];
    if (!sheet) {
        // Guaranteed safe string concatenation
        throw new Error("Sheet for student " + studentName + " not found. Please ensure the exact sheet name exists.");
    }

    // Load a large range of cells to find empty rows and write data
    // Assuming max 1000 rows for now as per requirements
    await sheet.loadCells('A1:K1000');

    // Find the first empty row starting from row 4 (Index 3)
    let startRowIndex = 3; 
    for (let r = 3; r < 1000; r++) {
      // Check column 0 (A) for content
      const cell = sheet.getCell(r, 0);
      if (!cell.value && cell.value !== 0) {
        startRowIndex = r;
        break;
      }
    }

    /**
     * COLUMN MAPPING (Input Index -> Sheet Column Index):
     * 0: Plan -> Col 0 (A)
     * 1: Actual Date -> Col 3 (D)
     * 2: Pages -> Col 4 (E) [Number]
     * 3: Student Listen -> Col 5 (F) [Checkbox]
     * 4: Sheikh Listen -> Col 6 (G) [Checkbox]
     * 5: Home Listen -> Col 7 (H) [Checkbox]
     * 6: Errors -> Col 8 (I) [Number]
     * 7: Grade -> Col 9 (J)
     * 8: Notes -> Col 10 (K)
     */

    extractedData.forEach((rowData, i) => {
      const rowIndex = startRowIndex + i;
      if (rowIndex >= 1000) return; // Prevent out of bounds

      // Helper to safely set value
      const setVal = (col, val) => {
        sheet.getCell(rowIndex, col).value = val;
      };

      // Col 0: Plan
      if (rowData[0]) setVal(0, rowData[0]);

      // Col 3: Actual Date
      if (rowData[1]) setVal(3, rowData[1]);

      // Col 4: Pages (Number)
      if (rowData[2]) {
         const val = Number(rowData[2]);
         setVal(4, isNaN(val) ? rowData[2] : val);
      }

      // Checkboxes: Col 5, 6, 7
      const setCheckbox = (colIdx, rawVal) => {
        const cell = sheet.getCell(rowIndex, colIdx);
        // Check for various "true" representations
        if (rawVal === 'TRUE' || rawVal === 'true' || rawVal === 'تم' || rawVal === true) {
             cell.value = true;
        } else {
             cell.value = false;
        }
      };

      if (rowData[3]) setCheckbox(5, rowData[3]);
      if (rowData[4]) setCheckbox(6, rowData[4]);
      if (rowData[5]) setCheckbox(7, rowData[5]);

      // Col 8: Errors (Number)
      if (rowData[6]) {
         const val = Number(rowData[6]);
         setVal(8, isNaN(val) ? rowData[6] : val);
      }

      // Col 9: Grade
      if (rowData[7]) setVal(9, rowData[7]);

      // Col 10: Notes
      if (rowData[8]) setVal(10, rowData[8]);
    });

    console.log("Writing " + extractedData.length + " rows starting at row " + (startRowIndex + 1));

    await sheet.saveUpdatedCells();

    res.json({
      success: true,
      message: 'Data successfully added under formatted table',
      rowsAdded: extractedData.length,
      sheetUrl: "https://docs.google.com/spreadsheets/d/" + process.env.SPREADSHEET_ID + "/edit#gid=" + sheet.sheetId
    });

  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

app.get('/api/student-records/:studentName', async (req, res) => {
  try {
    const { studentName } = req.params;

    if (!process.env.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID environment variable is missing');
    }

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[studentName];
    
    if (!sheet) {
      // If sheet doesn't exist, return empty array instead of error
      return res.json({ success: true, records: [] });
    }

    // Load cells A1:K1000 as per requirements
    await sheet.loadCells('A1:K1000');

    const records = [];
    
    // Iterate from row index 3 (row 4) downwards
    for (let r = 3; r < 1000; r++) {
      const planCell = sheet.getCell(r, 0); // Column 0: الخطة
      
      // Only collect rows where column 0 has a value
      if (planCell.value) {
        // Collect all columns 0-10
        const rowData = {
          plan: planCell.value, // 0
          // Col 1, 2 skipped in mapping? But let's check input mapping
          // Input 1 -> Col 3 (Actual Date)
          // Input 2 -> Col 4 (Pages)
          actualDate: sheet.getCell(r, 3).value,
          pages: sheet.getCell(r, 4).value,
          studentListen: sheet.getCell(r, 5).value,
          sheikhListen: sheet.getCell(r, 6).value,
          homeListen: sheet.getCell(r, 7).value,
          errors: sheet.getCell(r, 8).value,
          grade: sheet.getCell(r, 9).value,
          notes: sheet.getCell(r, 10).value,
        };
        records.push(rowData);
      }
    }

    // Return only the last 3 rows (most recent first)
    const recentRecords = records.slice(-3).reverse();

    res.json({
      success: true,
      records: recentRecords
    });

  } catch (error) {
    console.error('Error fetching student records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

app.get('/health', (req, res) => {
  res.send('Server is running and healthy.');
});

app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});
