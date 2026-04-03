export const downloadElementAsPdf = async (
  element: HTMLElement,
  filename: string,
) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const imageData = canvas.toDataURL('image/png');
  const imageWidth = pageWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  let heightLeft = imageHeight;
  let position = 0;

  pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imageHeight;
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
};
