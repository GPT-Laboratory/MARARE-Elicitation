import { useNavigate } from "react-router-dom"


export default function RAG_Button() {
    // const navigate = useNavigate()
  return (
    <button
              style={{
                position: 'fixed',
                bottom: '70px',
                right: '20px',
                padding: '12px 24px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
              onClick={()=>{navigate("/project/RAG_ChatBot")}}
              
            ><a href="/project/RAG_ChatBot">GO To Chat</a></button>
  )
}
