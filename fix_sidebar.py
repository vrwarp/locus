with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace("""        <button
          className={`nav-item ${currentView === 'missing' ? 'active' : ''}`}
          onClick={() => onChangeView('missing')}
        >
          <span className="icon">🚨</span>
          Missing Volunteers

          <span className="icon">📉</span>
          Attrition
        </button>""", """        <button
          className={`nav-item ${currentView === 'missing' ? 'active' : ''}`}
          onClick={() => onChangeView('missing')}
        >
          <span className="icon">🚨</span>
          Missing Volunteers
        </button>

        <button
          className={`nav-item ${currentView === 'attrition' ? 'active' : ''}`}
          onClick={() => onChangeView('attrition')}
        >
          <span className="icon">📉</span>
          Attrition
        </button>""")

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
