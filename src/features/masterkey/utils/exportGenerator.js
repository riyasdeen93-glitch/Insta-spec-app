import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Generate PDF export for master key system
 */
export const generatePDF = (exportData) => {
  const { project, hierarchies, zones, assignments, doors, standard, generatedAt } = exportData;

  // Create new PDF document with explicit configuration
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Title Page
  doc.setFontSize(20);
  doc.text('Master Key System', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Keying Schedule & Documentation', 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, 105, 40, { align: 'center' });
  doc.text(`Standard: ${standard.name} ${standard.version}`, 105, 47, { align: 'center' });

  // Project Information
  doc.setFontSize(14);
  doc.text('Project Information', 14, 60);

  doc.setFontSize(10);
  const projectInfo = [
    ['Standard', standard.name],
    ['Version', standard.version],
    ['Region', standard.region],
    ['Pin Configuration', `${standard.pinConfig.pins} pins, ${standard.pinConfig.depths} depths, MACS ${standard.pinConfig.macs}`],
    ['Max Differs Available', standard.maxDiffers.toLocaleString()],
    ['Differs Used', (project.differsUsed || 0).toLocaleString()],
    ['Keying Approach', project.keyingApproach || 'zone_based'],
  ];

  autoTable(doc, {
    startY: 65,
    head: [['Property', 'Value']],
    body: projectInfo,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Hierarchy Structure
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Hierarchy Structure', 14, 20);

  const hierarchyData = hierarchies
    .sort((a, b) => a.order - b.order)
    .map((h, idx) => [
      idx + 1,
      h.keySymbol,
      h.levelName,
      h.levelType,
      h.description || '-',
    ]);

  autoTable(doc, {
    startY: 25,
    head: [['#', 'Symbol', 'Level Name', 'Type', 'Description']],
    body: hierarchyData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Zones
  if (zones.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Zones Defined', 14, 20);

    const zoneData = zones.map((z, idx) => [
      idx + 1,
      z.zoneName,
      z.doorCount || 0,
      z.color,
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['#', 'Zone Name', 'Door Count', 'Color']],
      body: zoneData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });
  }

  // Door Assignments
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Door Assignments', 14, 20);

  const assignmentData = assignments.map((assignment, idx) => {
    const door = doors.find(d => d.id === assignment.doorId);
    const hierarchy = hierarchies.find(h => h.hierarchyId === assignment.hierarchyId);

    return [
      idx + 1,
      door?.mark || 'Unknown',
      door?.use || '-',
      door?.zone || '-',
      door?.level || '-',
      hierarchy?.keySymbol || '-',
      hierarchy?.levelName || '-',
    ];
  });

  autoTable(doc, {
    startY: 25,
    head: [['#', 'Door Mark', 'Use', 'Zone', 'Floor', 'Key Symbol', 'Key Level']],
    body: assignmentData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 },
  });

  // Statistics Summary (Last Page)
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Statistics Summary', 14, 20);

  const stats = [
    ['Total Doors', doors.length],
    ['Assigned Doors', assignments.length],
    ['Unassigned Doors', doors.length - assignments.length],
    ['Hierarchy Levels', hierarchies.length],
    ['Zones Defined', zones.length],
    ['Differs Used', project.differsUsed || 0],
    ['Differs Remaining', (project.maxDiffersAvailable || 0) - (project.differsUsed || 0)],
  ];

  autoTable(doc, {
    startY: 25,
    head: [['Metric', 'Value']],
    body: stats,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Save the PDF
  const filename = `master_key_schedule_${new Date().getTime()}.pdf`;
  doc.save(filename);

  return filename;
};

/**
 * Generate Excel workbook export
 */
export const generateExcel = (exportData) => {
  const { project, hierarchies, zones, assignments, doors, standard, generatedAt } = exportData;

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Project Info
  const projectInfoData = [
    ['Master Key System - Project Information'],
    [''],
    ['Generated', new Date(generatedAt).toLocaleString()],
    ['Standard', standard.name],
    ['Version', standard.version],
    ['Region', standard.region],
    ['Pin Configuration', `${standard.pinConfig.pins} pins, ${standard.pinConfig.depths} depths, MACS ${standard.pinConfig.macs}`],
    ['Max Differs Available', standard.maxDiffers],
    ['Differs Used', project.differsUsed || 0],
    ['Differs Remaining', (project.maxDiffersAvailable || 0) - (project.differsUsed || 0)],
    ['Keying Approach', project.keyingApproach || 'zone_based'],
  ];
  const wsProjectInfo = XLSX.utils.aoa_to_sheet(projectInfoData);
  XLSX.utils.book_append_sheet(wb, wsProjectInfo, 'Project Info');

  // Sheet 2: Hierarchy
  const hierarchyData = [
    ['#', 'Key Symbol', 'Level Name', 'Level Type', 'Order', 'Description'],
    ...hierarchies
      .sort((a, b) => a.order - b.order)
      .map((h, idx) => [
        idx + 1,
        h.keySymbol,
        h.levelName,
        h.levelType,
        h.order,
        h.description || '-',
      ]),
  ];
  const wsHierarchy = XLSX.utils.aoa_to_sheet(hierarchyData);
  XLSX.utils.book_append_sheet(wb, wsHierarchy, 'Hierarchy');

  // Sheet 3: Zones
  if (zones.length > 0) {
    const zoneData = [
      ['#', 'Zone Name', 'Door Count', 'Color'],
      ...zones.map((z, idx) => [
        idx + 1,
        z.zoneName,
        z.doorCount || 0,
        z.color,
      ]),
    ];
    const wsZones = XLSX.utils.aoa_to_sheet(zoneData);
    XLSX.utils.book_append_sheet(wb, wsZones, 'Zones');
  }

  // Sheet 4: Keying Schedule (Door Assignments)
  const keyingScheduleData = [
    ['#', 'Door Mark', 'Use', 'Zone', 'Floor', 'Key Symbol', 'Key Level', 'Hardware', 'Fire Rating', 'ADA'],
    ...assignments.map((assignment, idx) => {
      const door = doors.find(d => d.id === assignment.doorId);
      const hierarchy = hierarchies.find(h => h.hierarchyId === assignment.hierarchyId);

      return [
        idx + 1,
        door?.mark || 'Unknown',
        door?.use || '-',
        door?.zone || '-',
        door?.level || '-',
        hierarchy?.keySymbol || '-',
        hierarchy?.levelName || '-',
        door?.hardware || '-',
        door?.fireRating || '-',
        door?.ada ? 'Yes' : 'No',
      ];
    }),
  ];
  const wsKeyingSchedule = XLSX.utils.aoa_to_sheet(keyingScheduleData);
  XLSX.utils.book_append_sheet(wb, wsKeyingSchedule, 'Keying Schedule');

  // Sheet 5: Cutting List (Unique keys needed)
  const uniqueKeys = {};
  assignments.forEach(assignment => {
    const hierarchy = hierarchies.find(h => h.hierarchyId === assignment.hierarchyId);
    if (hierarchy) {
      if (!uniqueKeys[hierarchy.keySymbol]) {
        uniqueKeys[hierarchy.keySymbol] = {
          symbol: hierarchy.keySymbol,
          level: hierarchy.levelName,
          count: 0,
        };
      }
      uniqueKeys[hierarchy.keySymbol].count++;
    }
  });

  const cuttingListData = [
    ['Key Symbol', 'Key Level', 'Quantity Needed'],
    ...Object.values(uniqueKeys).map(key => [
      key.symbol,
      key.level,
      key.count,
    ]),
  ];
  const wsCuttingList = XLSX.utils.aoa_to_sheet(cuttingListData);
  XLSX.utils.book_append_sheet(wb, wsCuttingList, 'Cutting List');

  // Sheet 6: Statistics
  const statsData = [
    ['Master Key System - Statistics'],
    [''],
    ['Metric', 'Value'],
    ['Total Doors', doors.length],
    ['Assigned Doors', assignments.length],
    ['Unassigned Doors', doors.length - assignments.length],
    ['Hierarchy Levels', hierarchies.length],
    ['Zones Defined', zones.length],
    ['Differs Used', project.differsUsed || 0],
    ['Differs Remaining', (project.maxDiffersAvailable || 0) - (project.differsUsed || 0)],
    ['Utilization %', `${((project.differsUsed || 0) / (project.maxDiffersAvailable || 1) * 100).toFixed(2)}%`],
  ];
  const wsStats = XLSX.utils.aoa_to_sheet(statsData);
  XLSX.utils.book_append_sheet(wb, wsStats, 'Statistics');

  // Write the workbook
  const filename = `master_key_schedule_${new Date().getTime()}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
};

/**
 * Generate CSV files (multiple files in a zip would be ideal, but for simplicity we'll create one main CSV)
 */
export const generateCSV = (exportData) => {
  const { hierarchies, assignments, doors } = exportData;

  // Main keying schedule CSV
  const csvData = [
    ['Door Mark', 'Use', 'Zone', 'Floor', 'Hardware', 'Fire Rating', 'ADA', 'Key Symbol', 'Key Level'],
    ...assignments.map(assignment => {
      const door = doors.find(d => d.id === assignment.doorId);
      const hierarchy = hierarchies.find(h => h.hierarchyId === assignment.hierarchyId);

      return [
        door?.mark || 'Unknown',
        door?.use || '-',
        door?.zone || '-',
        door?.level || '-',
        door?.hardware || '-',
        door?.fireRating || '-',
        door?.ada ? 'Yes' : 'No',
        hierarchy?.keySymbol || '-',
        hierarchy?.levelName || '-',
      ];
    }),
  ];

  // Convert to CSV string
  const csvContent = csvData.map(row => row.join(',')).join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `master_key_schedule_${new Date().getTime()}.csv`;
  saveAs(blob, filename);

  return filename;
};

/**
 * Main export function that routes to the appropriate generator
 */
export const exportMasterKeySchedule = (format, exportData) => {
  try {
    let filename;

    switch (format) {
      case 'pdf':
        filename = generatePDF(exportData);
        break;
      case 'excel':
        filename = generateExcel(exportData);
        break;
      case 'csv':
        filename = generateCSV(exportData);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return { success: true, filename };
  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error: error.message };
  }
};
