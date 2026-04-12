let runs = [];
let allTests = [];
let selectedTestKey = null;
let activeFilter = null; // 'passed' | 'failed' | 'flaky' | 'skipped' | 'quarantine' | 'regressing' | null
let sidebarTagFilter = null;
let sidebarSpecFilter = null;
let currentPage = 'dashboard'; // 'dashboard' | 'trends' | 'gallery' | 'search' | 'quarantine'

/// Registry: short key → { src, title } — avoids embedding large data URIs in HTML attributes
const _shotReg = new Map();
let _shotSeq = 0;
let exportPickerTarget = null;
