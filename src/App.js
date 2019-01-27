import React, { Component } from 'react';
import ReactFileReader from 'react-file-reader';
import Form from 'react-bootstrap/lib/Form';
import { Radio, Col, Grid } from 'react-bootstrap';
import DatePicker from 'react-datepicker';

import './App.css';
import 'react-datepicker/dist/react-datepicker.css';

const LineChart = require('react-chartjs').Line;
require('blockadblock');

function peiToIndex(pei) {
  return 'PEI'.indexOf(pei);
}

function randomColor(i, opacity) {
  return `rgba(${(i * 85 + 117) % 256}, ${(i * 67 + 5) % 256}, ${(i * 219) % 256}, ${opacity})`;
}

class App extends Component {
  state = {
    adBlockDetected: false,
    currentPEI: 'P',
    personMap: null,
    dates: null,
    startDate: new Date(),
    endDate: new Date(),
  };

  constructor(props) {
    super(props);

    if (window.blockAdBlock) {
      window.blockAdBlock.onDetected(() => {
        this.setState({ adBlockDetected: true });
      });
    } else {
      this.setState({ adBlockDetected : true });
    }
  }

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

  onPEIChange = pei => {
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
    const { adBlockDetected, dates, personMap, currentPEI, startDate, endDate } = this.state;

    if (!personMap) {
      return (
        <div className={`empty-chart ${adBlockDetected ? 'adblock-detected' : ''}`}>
          {adBlockDetected ? (
            <div className='center'>
              <b>Please disable AdBlock to use PEI Visualizer</b>
              <p>Ads help keep this site running. Thanks for your support!</p>
            </div>
          ) : (
            <p className='center'>Upload a PEI file to see it visualized here!</p>
          )}
        </div>
      );
    }

    // Filter for start/end date
    let startIndex = null,
      endIndex = null;
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
        strokeColor: randomColor(i, 0.5),
        fillColor: randomColor(i, 0.05),
        pointColor: randomColor(i, 0.8),
        pointStrokeColor: '#fff',
        pointHighlightFill: randomColor(i, 1),
        pointHighlightStroke: '#fff',
        data: personMap[person].filter(dateFilter).map(a => a[peiToIndex(currentPEI)]),
      });
    });
    const chartData = {
      labels: dates.filter(dateFilter),
      datasets,
    };
    const chartOptions = {
      datasetFill: true,
    };

    const width = window.innerWidth < 1000 ? 600 : 800;
    const height = (width * 3) / 4;

    return <LineChart data={chartData} options={chartOptions} width={width} height={height} />;
  }

  render() {
    const { adBlockDetected, currentPEI, startDate, endDate } = this.state;

    return (
      <div className="App">
        <h1>PEI Visualizer</h1>
        <Grid>
          <Col lg={2} md={3} sm={3} xs={4}>
            <div className="file-upload">
              <p>
                Upload a CSV file with 5 columns: <b>Date, Name, P, E, I.</b>
              </p>
              <p>The file should be sorted in increasing order by Date.</p>
              <p>
                <a target="_blank" href="/example.csv">
                  Download Example
                </a>
              </p>
              <ReactFileReader fileTypes={['.csv']} handleFiles={this.handleFiles} disabled={adBlockDetected}>
                <button className={adBlockDetected ? 'disabled' : ''}>Upload CSV</button>
              </ReactFileReader>
            </div>
            <Form>
              {['P', 'E', 'I'].map(pei => (
                <Radio
                  key={pei}
                  checked={pei === currentPEI}
                  onChange={this.onPEIChange.bind(this, pei)}
                >
                  {pei}
                </Radio>
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
            <div
              className="gpt-ad"
              id="div-gpt-ad-1548576881046-0"
              style={{ height: '600px', width: '160px' }}
            />
          </Col>
          <Col lg={10} md={9} sm={9} xs={8}>
            <div
              className="gpt-ad"
              id="div-gpt-ad-1548574061321-0"
              style={{ height: '90px', width: '728px' }}
            />
            {this.renderChart()}
          </Col>
        </Grid>
      </div>
    );
  }
}

export default App;
