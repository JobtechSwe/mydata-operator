const client = {
  connect: jest.fn().mockResolvedValue(),
  query: jest.fn().mockResolvedValue({
    metaData: [],
    rows: []
  }),
  end: jest.fn().mockResolvedValue()
}
function Client () {
  return client
}

function clearMocks () {
  client.connect.mockClear()
  client.query.mockClear()
  client.end.mockClear()
}

module.exports = { Client, client, clearMocks, connection: client }
