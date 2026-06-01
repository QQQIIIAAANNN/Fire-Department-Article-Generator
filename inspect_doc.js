const fs = require('fs');

const docPath = 'c:\\Users\\zx262\\Downloads\\發文範本.doc';
console.log('File exists:', fs.existsSync(docPath));
if (fs.existsSync(docPath)) {
    const stats = fs.statSync(docPath);
    console.log('File size:', stats.size, 'bytes');
    const buffer = Buffer.alloc(100);
    const fd = fs.openSync(docPath, 'r');
    fs.readSync(fd, buffer, 0, 100, 0);
    fs.closeSync(fd);
    console.log('Header (hex):', buffer.toString('hex'));
    console.log('Header (ASCII):', buffer.toString('ascii'));
}
