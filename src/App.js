import React, { Component } from 'react';
import ReactFileReader from 'react-file-reader';
import Form from 'react-bootstrap/lib/Form';
import { Checkbox, Col, Grid } from 'react-bootstrap';
import DatePicker from 'react-datepicker';

import './App.css';
import 'react-datepicker/dist/react-datepicker.css';

const LineChart = require('react-chartjs').Line;

function peiToIndex(pei) {
  return 'PEI'.indexOf(pei);
}

function randomColor(i, opacity) {
  return `rgba(${(i * 85 + 117) % 256}, ${(i * 67 + 5) % 256}, ${(i * 219) % 256}, ${opacity})`;
}

class App extends Component {
  state = {
    currentPEI: 'P',
    personMap: null,
    dates: null,
    startDate: new Date(),
    endDate: new Date(),
  };

  handleFiles = files => {
    const reader = new FileReader();
    reader.onload = e => {
      const lines = reader.result.split('\n').slice(1); // ignore header
      const personMap = {};
      const dates = [];
      let startDate, endDate;
      lines.forEach((line, i) => {
        const elements = line.split(',');
        if (elements.length < 5) {
          return;
        }
        const date = elements[0];
        const person = elements[1];

        // Update start/end dates
        if (!startDate) {
          startDate = new Date(date);
        }
        endDate = new Date(date);

        if (!dates.includes(date)) {
          dates.push(date);
        }
        if (!personMap[person]) {
          personMap[person] = [];
        }

        personMap[person].push(elements.slice(2));
      });
      this.setState({ dates, personMap, startDate, endDate });
    };
    reader.readAsText(files[0]);
  };

  onCheckboxChange = pei => {
    this.setState({ currentPEI: pei });
  };

  onStartDateChange = startDate => {
    this.setState({ startDate });
    console.log(startDate);
  };

  onEndDateChange = endDate => {
    this.setState({ endDate });
  };

  renderChart() {
    const { dates, personMap, currentPEI, startDate, endDate } = this.state;

    if (!personMap) {
      return (
        <div className="empty-chart">
          <p>Upload a PEI file to see it visualized here!</p>
        </div>
      );
    }

    // Filter for start/end date
    let startIndex = null, endIndex = null;
    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      if (startIndex === null && currentDate >= startDate) {
        startIndex = i;
      }
      if (startIndex !== null && currentDate > endDate) {
        break;
      } else {
        endIndex = i;
      }
    }
    const dateFilter = (e, i) => i >= startIndex && i <= endIndex;

    const datasets = [];
    Object.keys(personMap).forEach((person, i) => {
      datasets.push({
        label: person,
        strokeColor: randomColor(i, 1),
        fillColor: randomColor(i, 0.1),
        pointColor: randomColor(i, 1),
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(220,220,220,1)',
        data: personMap[person]
          .filter(dateFilter)
          .map(a => a[peiToIndex(currentPEI)]),
      });
    });
    const chartData = {
      labels: dates.filter(dateFilter),
      datasets,
    };
    const chartOptions = {
      datasetFill: true,
    };

    return <LineChart data={chartData} options={chartOptions} width="800" height="600" />;
  }

  render() {
    const { currentPEI, startDate, endDate } = this.state;

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
              {['P', 'E', 'I'].map(pei => (
                <Checkbox
                  key={pei}
                  checked={pei === currentPEI}
                  onChange={this.onCheckboxChange.bind(this, pei)}
                >
                  {pei}
                </Checkbox>
              ))}
            </Form>
            <DatePicker
              selected={startDate}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              onChange={this.onStartDateChange}
            />
            <DatePicker
              selected={endDate}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              onChange={this.onEndDateChange}
            />
          </Col>
          <Col md={10}>{this.renderChart()}</Col>
        </Grid>
      </div>
    );
  }
}

export default App;
