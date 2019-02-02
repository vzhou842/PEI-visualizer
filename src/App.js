import React, { Component } from 'react';
import ReactFileReader from 'react-file-reader';
import Form from 'react-bootstrap/lib/Form';
import { Checkbox, Col, Grid, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import DatePicker from 'react-datepicker';

import { GET, POST } from './HTTP';
import ShareLink from './ShareLink';

import './App.css';
import 'react-datepicker/dist/react-datepicker.css';

const LineChart = require('react-chartjs').Line;
require('blockadblock');

function peiToIndex(pei) {
  return 'PEI'.indexOf(pei);
}

function indexToPEI(index) {
  return 'PEI'[index];
}

function randomColor(i, opacity) {
  return `rgba(${(i * 85 + 117) % 256}, ${(i * 67 + 5) % 256}, ${(i * 219) % 256}, ${opacity})`;
}

const LINK_DATA_NONE = 0;
const LINK_DATA_LOADING = 1;
const LINK_DATA_ERROR = 2;

class App extends Component {
  state = {
    adBlockDetected: false,
    currentPEI: 'P',
    disabledPeople: {},
    link: null,
    linkDataState: LINK_DATA_NONE,
    personMap: null,
    dates: null,
    startDate: new Date(),
    endDate: new Date(),
  };

  constructor(props) {
    super(props);

    // Check for AdBlock
    if (window.blockAdBlock) {
      window.blockAdBlock.onDetected(() => {
        this.setState({ adBlockDetected: true });
      });
    } else {
      this.state.adBlockDetected = true;
    }

    // Download link data if needed
    const { pathname } = window.location;
    if (pathname.includes('/link/')) {
      this.state.linkDataState = LINK_DATA_LOADING;
      GET(`${pathname}/data`)
        .then(data => {
          const dataObj = JSON.parse(data);
          const startDate = new Date(dataObj.dates[0]);
          const endDate = new Date(dataObj.dates[dataObj.dates.length - 1]);
          this.setState({
            ...dataObj,
            startDate,
            endDate,
            link: pathname,
            linkDataState: LINK_DATA_NONE,
          });
        })
        .catch(err => {
          console.error(err);
          this.setState({ linkDataState: LINK_DATA_ERROR });
        });
    }
  }

  handleFiles = files => {
    const reader = new FileReader();
    reader.onload = e => {
      const lines = reader.result.split('\n').slice(1); // ignore header
      const personMap = {};
      const dates = [];
      let startDate, endDate;

      // First pass - personMap maps person -> date -> [p, e, i]
      lines.forEach((line, i) => {
        const elements = line.split(',');
        const date = elements[0];
        let person = elements[1];
        if (elements.length < 5 || !date || !person) {
          return;
        }
        person = person.trim();

        // Update start/end dates
        if (!startDate) {
          startDate = new Date(date);
        }
        endDate = new Date(date);

        if (!dates.includes(date)) {
          dates.push(date);
        }
        if (!personMap[person]) {
          personMap[person] = {};
        }

        // Make sure PEI are valid numbers
        const pei = elements.slice(2);
        for (let i = 0; i < pei.length; i++) {
          if (Number.isNaN(parseFloat(pei[i]))) {
            return;
          }
        }
        personMap[person][date] = pei;
      });

      // Second pass - modify personMap to an array based on dates
      for (const person in personMap) {
        const personArr = [];
        dates.forEach(date => {
          personArr.push(personMap[person][date]);
        });
        personMap[person] = personArr;
      }

      // Update state.
      this.setState({ dates, personMap, startDate, endDate });

      // Request the server for a link
      POST('/link/new', { data: { dates, personMap } })
        .then(link => {
          window.history.replaceState(null, null, link);
          this.setState({ link });
        })
        .catch(console.error);
    };
    reader.readAsText(files[0]);
  };

  onPEIChange = index => {
    this.setState({ currentPEI: indexToPEI(index) });
  };

  onStartDateChange = startDate => {
    this.setState({ startDate });
  };

  onEndDateChange = endDate => {
    this.setState({ endDate });
  };

  onTogglePerson = person => {
    const { disabledPeople } = this.state;
    this.setState({ disabledPeople: { ...disabledPeople, [person]: !disabledPeople[person] } });
  };

  renderChart() {
    const {
      adBlockDetected,
      dates,
      disabledPeople,
      linkDataState,
      personMap,
      currentPEI,
      startDate,
      endDate,
    } = this.state;

    if (linkDataState !== LINK_DATA_NONE) {
      return (
        <div className="empty-chart">
          {linkDataState === LINK_DATA_ERROR ? (
            <div className="center">
              <h4>Link Not Found</h4>
              <p>We couldn't find any data associated with this link - it may be expired.</p>
              <a href="/">Upload New CSV</a>
            </div>
          ) : (
            <div className="center">
              <h4>Loading Data...</h4>
            </div>
          )}
        </div>
      );
    }

    const emptyPersonMap = personMap && !Object.keys(personMap).length;
    if (!personMap || emptyPersonMap) {
      return (
        <div className={`empty-chart ${adBlockDetected ? 'adblock-detected' : ''}`}>
          {adBlockDetected ? (
            <div className="center">
              <b>Please disable AdBlock to use PEI Visualizer</b>
              <p>Ads help keep this site running. Thanks for your support!</p>
            </div>
          ) : (
            <div className="center">
              {emptyPersonMap && <b>The file you uploaded contained no valid data.</b>}
              <p>
                Upload a CSV file with 5 columns: <b>Date, Name, P, E, I.</b>
              </p>
              <p>The file should be sorted in increasing order by Date.</p>
              <p>
                <a target="_blank" href="/example.csv">
                  Download Example CSV
                </a>
              </p>
              <ReactFileReader
                fileTypes={['.csv']}
                handleFiles={this.handleFiles}
                disabled={adBlockDetected}
              >
                <button>Upload CSV</button>
              </ReactFileReader>
            </div>
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

    // Build the chart data
    const datasets = [];
    Object.keys(personMap)
      .filter(person => !disabledPeople[person])
      .forEach((person, i) => {
        datasets.push({
          label: person,
          strokeColor: randomColor(i, 0.5),
          fillColor: randomColor(i, 0.05),
          pointColor: randomColor(i, 0.8),
          pointStrokeColor: '#fff',
          pointHighlightFill: randomColor(i, 1),
          pointHighlightStroke: '#fff',
          data: personMap[person]
            .filter(dateFilter)
            .map(a => (a ? a[peiToIndex(currentPEI)] : null)),
        });
      });
    const chartData = {
      labels: dates.filter(dateFilter),
      datasets,
    };
    const chartOptions = {
      datasetFill: true,
    };

    const width = Math.min(1000, Math.max(400, Math.round(window.innerWidth * 0.6)));
    const height = Math.round((width * 3) / 4);

    return (
      <LineChart data={chartData} redraw options={chartOptions} width={width} height={height} />
    );
  }

  render() {
    const { currentPEI, disabledPeople, link, personMap, startDate, endDate } = this.state;

    return (
      <div className="App">
        <div className="header">
          <h1>PEI Visualizer</h1>
          <p>
            A <b>P</b>hysical, <b>E</b>motional, and <b>I</b>ntellectual health visualizer.
          </p>
        </div>
        <Grid>
          <Col xl={2} lg={3} md={3} sm={4} xs={4}>
            {link && <ShareLink />}
            <ToggleButtonGroup
              type="radio"
              name="PEI"
              className="PEI-button-group"
              value={peiToIndex(currentPEI)}
              onChange={this.onPEIChange}
            >
              {['P', 'E', 'I'].map(pei => (
                <ToggleButton key={pei} value={peiToIndex(pei)}>
                  {pei}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <br />
            <DatePicker
              selected={startDate}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              onChange={this.onStartDateChange}
              placeholderText="Start Date"
            />
            <DatePicker
              selected={endDate}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              onChange={this.onEndDateChange}
              placeholderText="End Date"
            />
            <Form>
              {personMap &&
                Object.keys(personMap).map(person => (
                  <Checkbox
                    key={person}
                    checked={!disabledPeople[person]}
                    onChange={this.onTogglePerson.bind(this, person)}
                  >
                    {person}
                  </Checkbox>
                ))}
            </Form>
            <div
              className="gpt-ad"
              id="div-gpt-ad-1548576881046-0"
              style={{ height: '600px', width: '160px' }}
            />
          </Col>
          <Col xl={10} lg={9} md={9} sm={8} xs={8}>
            <div
              className="gpt-ad"
              id="div-gpt-ad-1548574061321-0"
              style={{ height: '90px', width: '728px' }}
            />
            {this.renderChart()}
          </Col>
        </Grid>
        <Grid className="faq">
          <h2>FAQ</h2>
          <h3>What is Physical Health?</h3>
          <p>
            Physical Health is the ability to maintain a healthy quality of life that allows us to
            get through our daily activities without undue fatigue or physical stress. The ability
            to recognize that our behaviors have a significant impact on our wellness and adopting
            healthful habits while avoiding destructive habits will lead to optimal Physical Health.
          </p>
          <h3>What is Emotional Health?</h3>
          <p>
            Emotional Health is the ability to understand ourselves and cope with the challenges
            life can bring. The ability to acknowledge and share feelings of anger, fear, sadness,
            stress, hope, love, joy and happiness in a productive manner contributes to our
            Emotional Health.
          </p>
          <h3>What is Intellectual Health?</h3>
          <p>
            Intellectual Health is the ability to open our minds to new ideas and experiences that
            can be applied to personal decisions, group interaction and community betterment. The
            desire to learn new concepts, improve skills and seek challenges in pursuit of lifelong
            learning contributes to our Intellectual Health.
          </p>
          <h3>Where can I learn more?</h3>
          <p>
            Read more about the{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://wellness.ucr.edu/seven_dimensions.html"
            >
              Seven Dimensions of Wellness
            </a>{' '}
            from the University of California, Riverside.
          </p>
        </Grid>
      </div>
    );
  }
}

export default App;
