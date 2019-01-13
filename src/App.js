import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ReactFileReader from 'react-file-reader';
import Form from 'react-bootstrap/lib/Form';
import { Checkbox } from 'react-bootstrap';

const LineChart = require('react-chartjs').Line;

function indexToPEI(i) {
  return 'PEI'[i];
}

class App extends Component {
  state = { currentPerson: null, personMap: null, dates: null };

  handleFiles = files => {
    const reader = new FileReader();
    reader.onload = e => {
      const lines = reader.result.split('\n').slice(1); // ignore header
      const personMap = {};
      const dates = [];
      let currentPerson = null;
      lines.forEach(line => {
        const elements = line.split(',');
        const date = elements[0];
        const person = elements[1];
        if (!currentPerson) {
          currentPerson = person;
        }
        if (!dates.includes(date)) {
          dates.push(date);
        }
        if (!personMap[person]) {
          personMap[person] = [];
        }
        personMap[person].push(elements.slice(2));
      });
      this.setState({ dates, personMap, currentPerson });
    }
    reader.readAsText(files[0]);
  };

  onCheckboxChange = person => {
    // TODO
  };

  renderChart() {
    const { dates, personMap, currentPerson } = this.state;

    if (!personMap) {
      return null;
    }

    const datasets = [];
    for (let i = 0; i < 3; i++) {
      datasets.push({
        label: `${currentPerson} ${indexToPEI(i)}`,
        strokeColor: `rgb(${i * 25 + 25}, ${i * 50 + 100}, ${i * 100 + 200})`,
        fillColor: `rgba(${i * 25 + 25}, ${i * 50 + 100}, ${i * 100 + 200}, 0.2)`,
        pointColor: `rgb(${i * 25 + 25}, ${i * 50 + 100}, ${i * 100 + 200})`,
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: personMap[currentPerson].map(a => a[i]),
      });
    }
    const chartData = {
      labels: dates,
      datasets,
    };
    const chartOptions = {
      datasetFill: true,
    };
    
    return (
      <div>
        <LineChart data={chartData} options={chartOptions} width="800" height="600" />
        <Form>
          {
            Object.keys(personMap).map(person => (
              <Checkbox checked={person === currentPerson} onChange={this.onCheckboxChange.bind(this, person)}>
                {person}
              </Checkbox>
            ))
          }
        </Form>
      </div>
    );
  }

  render() {
    return (
      <div className="App">
        <ReactFileReader fileTypes={['.csv']} handleFiles={this.handleFiles}>
          <button>Upload</button>
        </ReactFileReader>
        {this.renderChart()}
      </div>
    );
  }
}

export default App;
