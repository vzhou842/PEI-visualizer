import React, { PureComponent } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import './ShareLink.css';

export default class ShareLink extends PureComponent {
  state = { copied: false };

  componentWillUnmount() {
    clearTimeout(this.copyTimeout);
  }

  onCopy = () => {
    this.setState({ copied: true });

    clearTimeout(this.copyTimeout);
    this.copyTimeout = setTimeout(() => {
      this.setState({ copied: false });
    }, 3000);
  };

  render() {
    const { copied } = this.state;

    return (
      <div className="share-link">
        <p>Share your current link to let others view this PEI graph!</p>
        <CopyToClipboard text={window.location.href} onCopy={this.onCopy}>
          <button>{copied ? 'Copied!' : 'Copy Link'}</button>
        </CopyToClipboard>
      </div>
    );
  }
}
