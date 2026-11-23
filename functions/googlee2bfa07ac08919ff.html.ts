export const onRequestGet = async () => {
  return new Response('google-site-verification: googlee2bfa07ac08919ff.html\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};
