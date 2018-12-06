exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.createTable('apps', {
    id: { type: 'uuid', primaryKey: true },
    name: { type: 'string', notNull: true, unique: true },
    description: { type: 'string', notNull: true },
    client_id: { type: 'string', notNull: true, unique: true },
    jwks_url: { type: 'string', notNull: true, unique: true }
  })
}

exports.down = (pgm) => {
  pgm.dropTable('apps')
}
