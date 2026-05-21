export const downloadCSV = <T extends Record<string, any>>(data: T[], filename: string) => {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV rows
  const csvRows = [];

  // Add headers row
  csvRows.push(headers.map(header => `"${header}"`).join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        // Simple stringification for nested objects, or could just be [object Object]
        // Often we map the data before passing to downloadCSV to keep it flat
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }

      // Escape double quotes
      val = val.replace(/"/g, '""');

      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
