import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Button, Table, Typography, message } from "antd";
import axios from "axios";
import { socketURL } from "./socketInstance";
import { useRefs } from "./RefProvider";

const { Title } = Typography;

const Metrices = () => {
  const [metrics, setMetrics] = useState([]);
  const [isLLMLoading, setisLLMLoading] = useState(false);
  const [isFormulaLoading, setisFormulaLoading] = useState(false);
  const {
    localTranscript,
    //   remoteTranscript,
    //   agentTranscript,
    // ADD THIS
  } = useRefs();

  // Get transcript and teams from Redux slice

  const teamA = useSelector((state) => state.reports.teamA);
  const teamB = useSelector((state) => state.reports.teamB);
  const teamC = useSelector((state) => state.reports.teamC);

  const handleEvaluate = async () => {
    if (!teamA.vision || !teamA.mvp || !teamB.vision || !teamB.mvp || !teamC.vision || !teamC.mvp) {
      message.error("Please make sure the transcript and all team fields are filled.");
      return;
    }

    const teams = [
      { name: "Team A", vision: teamA.vision, mvp: teamA.mvp },
      { name: "Team B", vision: teamB.vision, mvp: teamB.mvp },
      { name: "Team C", vision: teamC.vision, mvp: teamC.mvp },
    ];

    setisLLMLoading(true);

    try {
      const response = await axios.post(`${socketURL}/evaluate_teams`, {
        transcript: localTranscript.join("\n"),
        teams,
      });
      setMetrics(response.data.teams || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to evaluate teams.");
    } finally {
      setisLLMLoading(false);
    }
  };




  // const handleCalculate = async () => {
  //   if (!teamA.vision || !teamA.mvp || !teamB.vision || !teamB.mvp || !teamC.vision || !teamC.mvp) {
  //     message.error("Please make sure the transcript and all team fields are filled.");
  //     return;
  //   }

  //   const teams = [
  //     { name: "Team A", vision: teamA.vision, mvp: teamA.mvp },
  //     { name: "Team B", vision: teamB.vision, mvp: teamB.mvp },
  //     { name: "Team C", vision: teamC.vision, mvp: teamC.mvp },
  //   ];


  //   setisFormulaLoading(false);


  //   try {
  //     const response = await axios.post(`${socketURL}/evaluate_teams_with_formulas`, {
  //       transcript: localTranscript.join("\n"),
  //       teams,
  //     });
  //     setMetrics(response.data.teams || []);
  //   } catch (err) {
  //     console.error(err);
  //     message.error("Failed to evaluate teams.");
  //   } finally {
  //     setisFormulaLoading(false);
  //   }
  // };


  const handleCalculate = async () => {
  if (
    !teamA.vision || !teamA.mvp ||
    !teamB.vision || !teamB.mvp ||
    !teamC.vision || !teamC.mvp
  ) {
    message.error("Please make sure the transcript and all team fields are filled.");
    return;
  }

  const teams = [
    { name: "Team A", vision: teamA.vision, mvp: teamA.mvp },
    { name: "Team B", vision: teamB.vision, mvp: teamB.mvp },
    { name: "Team C", vision: teamC.vision, mvp: teamC.mvp },
  ];

  setisFormulaLoading(true); // show loading first

  try {
    // wait 2 seconds before calling backend
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await axios.post(`${socketURL}/evaluate_teams_with_formulas`, {
      transcript: localTranscript.join("\n"),
      teams,
    });

    setMetrics(response.data.teams || []);
  } catch (err) {
    console.error(err);
    message.error("Failed to evaluate teams.");
  } finally {
    setisFormulaLoading(false); // stop loading
  }
};



  const columns = [
    { title: "Team", dataIndex: "name", key: "name" },
    { title: "Hallucination Rate", dataIndex: "HR", key: "HR", render: val => (val * 100).toFixed(1) + "%" },
    { title: "Coverage", dataIndex: "CV", key: "CV", render: val => (val * 100).toFixed(1) + "%" },
    { title: "Semantic Similarity", dataIndex: "SSIM", key: "SSIM", render: val => val.toFixed(2) },
    { title: "Latency (s)", dataIndex: "Latency", key: "Latency" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between flex-col items-center mb-6">
        <Title level={3} className="mb-4">Evaluate Team Metrics</Title>

        <div className="md:flex gap-4">
          <Button type="primary" onClick={handleEvaluate} className="mb-2" disabled={isFormulaLoading}
          loading={isLLMLoading}
          > 
           with LLM ((
          <b>gpt-4o-mini</b>))
          </Button>
      
            
        


          <Button type="primary" onClick={handleCalculate} disabled={isLLMLoading}
          loading={isFormulaLoading}
          > 
            Calculate with Formulas
          </Button>
        </div>

      </div>

      {metrics.length > 0 && (
        <Table
          dataSource={metrics}
          columns={columns}
          rowKey="name"
          pagination={false}
          className="mt-6"
          scroll={{ x: '300' }} 
        />
      )}
    </div>
  );
};

export default Metrices;
