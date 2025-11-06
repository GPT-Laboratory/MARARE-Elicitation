


// src/components/ArtifactScorer.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Card, Button, Typography, Descriptions, Space, message, Row, Col } from "antd";
import axios from "axios";
import { socketURL } from "./socketInstance";
import { useRefs } from "./RefProvider";

const { Title, Paragraph } = Typography;

const ArtifactScorer = () => {
  const {
    localTranscript,
  } = useRefs();
  
  const teamA = useSelector((s) => s.reports.teamA);
  const teamB = useSelector((s) => s.reports.teamB);
  const teamC = useSelector((s) => s.reports.teamC);

  const [loading, setLoading] = useState({
    teamA: false,
    teamB: false,
    teamC: false,
  });
  
  const [results, setResults] = useState({
    teamA: null,
    teamB: null,
    teamC: null,
  });

  const teams = {
    teamA: { label: "Team A", data: teamA },
    teamB: { label: "Team B", data: teamB },
    teamC: { label: "Team C", data: teamC },
  };

  const runScore = async (teamKey) => {
    const team = teams[teamKey];
    if (!team.data?.vision?.trim() || !team.data?.mvp?.trim()) {
      message.error(`MVP and Vision are required for ${team.label}.`);
      return;
    }
    
    setLoading(prev => ({ ...prev, [teamKey]: true }));
    setResults(prev => ({ ...prev, [teamKey]: null }));
    
    try {
      const { data } = await axios.post(`${socketURL}/score_artifacts`, {
        transcript: localTranscript.join("\n"),
        mvp: team.data.mvp,
        vision: team.data.vision,
      });
      
      if (data.error) {
        message.error(data.error);
      } else {
        setResults(prev => ({ ...prev, [teamKey]: data }));
      }
    } catch (e) {
      console.error(e);
      message.error(`Failed to score artifacts for ${team.label}.`);
    } finally {
      setLoading(prev => ({ ...prev, [teamKey]: false }));
    }
  };

  const ScoreCard = ({ score, label }) => (
    <div className="text-center p-3 bg-gray-50 rounded-lg border">
      <div className="text-2xl font-bold text-blue-600 mb-1">{score}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Title level={2} className="text-center mb-6">Requirements Artifact Scorer</Title>
      
      {/* Scoring Legend */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <Title level={4} className="text-center mb-4 text-blue-800">Scoring Legend</Title>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={12} sm={6}>
            <div className="text-center p-3 bg-red-100 rounded-lg border border-red-200">
              <div className="text-xl font-bold text-red-700 mb-1">0</div>
              <div className="text-sm text-red-600">Incorrect</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-3 bg-orange-100 rounded-lg border border-orange-200">
              <div className="text-xl font-bold text-orange-700 mb-1">1</div>
              <div className="text-sm text-orange-600">Partly Correct</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-3 bg-yellow-100 rounded-lg border border-yellow-200">
              <div className="text-xl font-bold text-yellow-700 mb-1">2</div>
              <div className="text-sm text-yellow-600">Mostly Complete</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
              <div className="text-xl font-bold text-green-700 mb-1">3</div>
              <div className="text-sm text-green-600">Fully Complete</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Team Cards */}
      <Row gutter={[24, 24]}>
        {Object.entries(teams).map(([teamKey, team]) => (
          <Col xs={24} lg={8} key={teamKey}>
            <Card 
              title={
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{team.label}</span>
                  <Button 
                    type="primary" 
                    loading={loading[teamKey]} 
                    onClick={() => runScore(teamKey)}
                    size="small"
                  >
                    Score 
                  </Button>
                </div>
              }
              className="h-full"
            >
              <Space direction="vertical" size="middle" className="w-full">
                
                {/* Results */}
                {results[teamKey] && (
                  <div className="mt-4 pt-4 border-t">
                    <Title level={5} className="mb-3">Scores</Title>
                    <Row gutter={[8, 8]} className="mb-4">
                      <Col span={12}>
                         <label htmlFor="" className="text-xs font-bold">Correctness</label>
                        <ScoreCard score={results[teamKey].Correctness} className='text-sm' />
                      </Col>
                      <Col span={12}>
                       <label htmlFor="" className="text-xs font-bold">Completeness</label>
                        <ScoreCard score={results[teamKey].Completeness} className='text-sm'  />
                      </Col>
                      <Col span={12}>
                      <label htmlFor="" className="text-xs font-bold">Consistency</label>
                        <ScoreCard score={results[teamKey].Consistency} className='text-sm'  />
                      </Col>
                      <Col span={12}>
                      <label htmlFor="" className="text-xs font-bold">Clarity</label>
                        <ScoreCard score={results[teamKey].Clarity} className='text-sm'  />
                      </Col>
                    </Row>
                    
                    <div className="text-center p-2 bg-blue-50 rounded border mb-3">
                      <div className="text-sm text-gray-600 font-bold">Latency</div>
                      <div className="font-semibold">{results[teamKey].Latency}s</div>
                    </div>

                    <div>
                      <Title level={5} className="mb-2">Rationale</Title>
                      <div className="text-sm p-3 bg-gray-50 rounded-lg border  max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {results[teamKey].Rationale}
                      </div>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ArtifactScorer;