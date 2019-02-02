export async function GET(url) {
  return new Promise((accept, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = () => {
      if (xhr.status === 200) {
        accept(xhr.response);
      } else {
        reject(xhr.status);
      }
    };
    xhr.send();
  });
}

export async function POST(url, params) {
  return new Promise((accept, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = () => {
      if (xhr.status === 200) {
        accept(xhr.response);
      } else {
        reject(xhr.status);
      }
    };
    xhr.send(JSON.stringify(params));
  });
}
