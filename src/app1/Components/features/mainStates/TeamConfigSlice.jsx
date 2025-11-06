// Add this to your Redux slice file (or create a new one)

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  teamA: {
    agent1: {
      model: 'llama3.1:latest',
      prompt: 'You are tasked with analyzing the provided transcript and extracting key information that will help in shaping a Minimum Viable Product (MVP) and an overall vision. Carefully identify the user’s core needs, the main problem being solved, and the essential features that must be prioritized in the MVP.',
      modelType: 'simple'
    },
    agent2: {
      model: 'llama2:latest',
      prompt: 'Based on the initial MVP and vision, refine and enhance the ideas by ensuring they are practical, realistic, and aligned with industry best practices. Evaluate whether the proposed MVP solves the user’s problem effectively and whether the vision is inspiring yet achievable. Provide structured feedback, highlight strengths, and point out gaps.',
      modelType: 'simple'
    }
  },
  teamB: {
    agent1: {
      model: 'mistral:latest',
      prompt: 'From the given transcript, generate a proposal for a Minimum Viable Product (MVP) along with a long-term vision. Break down the core functionality, identify must-have features for the MVP. Then, expand the vision by outlining how the product could evolve in future iterations, incorporating potential scalability, user growth, and market opportunities.',
      modelType: 'simple'
    },
    agent2: {
      model: 'mistral:7b',
      prompt: 'Create a structured, well-organized document that describes both the MVP and the vision for the project. The MVP should include a prioritized list of features, and user experience goals. The vision should describe the ultimate outcome the project is aiming for, future enhancements, and how it could become a sustainable solution.',
      modelType: 'simple'
    }
  },
  teamC: {
    agent1: {
      model: 'gpt-3.5-turbo',
      prompt: 'Develop a plan for the Minimum Viable Product (MVP) and the long-term vision of the project using the provided transcript as your main source. Identify the critical insights, define user pain points, and translate them into product features. Clearly explain why these features are essential for the MVP and how they set the foundation for the larger vision. Provide your response in a structured format that makes it easy to review and understand.',
      modelType: 'simple'
    },
    agent2: {
      model: 'gpt-4o',
      prompt: 'Provide the MVP and vision for the project. The MVP section should focus on the essential features, and immediate value it delivers to users. The vision section should articulate the long-term aspirations, potential market positioning, and opportunities for innovation. Ensure the language is clear, and compelling',
      modelType: 'simple'
    }
  }
};

const teamConfigSlice = createSlice({
  name: 'teamConfig',
  initialState,
  reducers: {
    updateTeamAgent: (state, action) => {
      const { team, agent, field, value } = action.payload;
      state[team][agent][field] = value;
    },
    resetTeamConfig: (state) => {
      return initialState;
    }
  }
});

export const { updateTeamAgent, resetTeamConfig } = teamConfigSlice.actions;
export default teamConfigSlice.reducer;