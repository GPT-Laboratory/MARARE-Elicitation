import React from "react";
import { Button, Space, message } from "antd";
import { FilePdfOutlined, DownloadOutlined } from "@ant-design/icons";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const DownloadPDFButtons = ({ allTranscripts, teams }) => {
  // ✅ Download Transcript as PDF
  const downloadTranscript = () => {
    if (!allTranscripts || allTranscripts.length === 0) {
      message.warning("No transcript available to download!");
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Meeting Transcript", 14, 20);

    // Prepare table data
    const tableData = allTranscripts.map((item, idx) => [
      idx + 1,
      item.speaker || item.source,
      item.message || item.text,
    ]);

    autoTable(doc, {
      head: [["#", "Speaker", "Message"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10, cellWidth: "wrap" },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 140 },
      },
    });

    doc.save("Meeting_Transcript.pdf");
    message.success("Transcript downloaded!");
  };

  // ✅ Download Teams Data as PDF
  const downloadTeamsData = () => {
    if (!teams || teams.length === 0) {
      message.warning("No teams data available to download!");
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Teams Proposal Data", 14, 20);

    // Prepare table data
    const tableData = teams.map((team, idx) => [
      idx + 1,
      team.name,
      team.data?.mvp || "N/A",
      team.data?.vision || "N/A",
    ]);

    autoTable(doc, {
      head: [["#", "Team", "MVP", "Vision"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10, cellWidth: "wrap" },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 70 },
        3: { cellWidth: 70 },
      },
    });

    doc.save("Teams_Data.pdf");
    message.success("Teams data downloaded!");
  };

  return (
    <Space style={{ marginBottom: 16 }}>
      <Button
        type="primary"
        icon={<FilePdfOutlined />}
        onClick={downloadTranscript}
      >
        Download Transcript
      </Button>

      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={downloadTeamsData}
      >
        Download Teams Data
      </Button>
    </Space>
  );
};

export default DownloadPDFButtons;
