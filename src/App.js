import React, { Component } from 'react';
import './App.css';
import ReactFileReader from 'react-file-reader';
import Form from 'react-bootstrap/lib/Form';
import { Checkbox, Col, Grid } from 'react-bootstrap';

const LineChart = require('react-chartjs').Line;

function peiToIndex(pei) {
  return 'PEI'.indexOf(pei);
}

function randomColor(i, opacity) {
  return `rgba(${(i * 85 + 117) % 256}, ${(i * 67 + 5) % 256}, ${(i * 219) % 256}, ${opacity})`;
}

class App extends Component {
  state = { currentPEI: 'P', personMap: null, dates: null };

  handleFiles = files => {
    const reader = new FileReader();
    reader.onload = e => {
      const lines = reader.result.split('\n').slice(1); // ignore header
      const personMap = {};
      const dates = [];
      lines.forEach(line => {
        const elements = line.split(',');
        if (elements.length < 5) {
          return;
        }
        const date = elements[0];
        const person = elements[1];
        if (!dates.includes(date)) {
          dates.push(date);
        }
        if (!personMap[person]) {
          personMap[person] = [];
        }
        personMap[person].push(elements.slice(2));
      });
      this.setState({ dates, personMap });
    };
    reader.readAsText(files[0]);
  };

  onCheckboxChange = pei => {
    this.setState({ currentPEI: pei });
  };

  renderChart() {
    const { dates, personMap, currentPEI } = this.state;

    if (!personMap) {
      return null;
    }

    const datasets = [];
    Object.keys(personMap).forEach((person, i) => {
      datasets.push({
        label: person,
        strokeColor: randomColor(i, 1),
        fillColor: randomColor(i, 0.1),
        pointColor: randomColor(i, 1),
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: personMap[person].map(a => a[peiToIndex(currentPEI)]),
      });
    });
    const chartData = {
      labels: dates,
      datasets,
    };
    const chartOptions = {
      datasetFill: true,
    };

    return (
      <LineChart data={chartData} options={chartOptions} width="800" height="600" />
    );
  }

  render() {
    const { currentPEI } = this.state;

    return (
      <div className="App">
        <h1>PEI Visualizer</h1>
        <Grid>
          <Col md={2}>
            <div className="file-upload">
              <ReactFileReader fileTypes={['.csv']} handleFiles={this.handleFiles}>
                <button>Upload</button>
              </ReactFileReader>
            </div>
            <Form>
              {
                ['P', 'E', 'I'].map(pei => (
                  <Checkbox key={pei} checked={pei === currentPEI} onChange={this.onCheckboxChange.bind(this, pei)}>
                    {pei}
                  </Checkbox>
                ))
              }
            </Form>
          </Col>
          <Col md={10}>
            {this.renderChart()}
          </Col>
        </Grid>
      </div>
    );
  }
}

export default App;
