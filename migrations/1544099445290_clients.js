exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.renameTable('apps', 'clients')
  pgm.addColumns('clients', {
    public_key: { type: 'string', notNull: true },
    registered_date: { type: 'timestamp', default: pgm.func('NOW()') }
  })
}

exports.down = (pgm) => {
  pgm.dropColumns('clients', ['public_key', 'registered_date'])
  pgm.renameTable('clients', 'apps')
}
