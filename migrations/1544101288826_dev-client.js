exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.sql(`INSERT INTO clients(id, name, description, client_id, jwks_url, public_key) VALUES(
    'b311d654-6179-49f6-abc9-037ef758c6ef',
    'CV app dev',
    'An app to register your CV in a safe dev environment',
    'dev.cvapp.work',
    'http://localhost:4000/jwks',
    '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAyyZqezfhw2uJJMMPNqlm6nq8scFTMsMdNWf/ZI5nCuouo7sguU2K\nj8ZcEADSGWa+bu2/mnXwqpX5nYESSI0pJGv+DymWVv0JhCXnH+GYLIE+9Ik3RZXx\n5odaNceUrCa1/xNslg7Mxu/KNEsUbYgNDc0ia2pTruldMx+osaqKLo3XqlnYZ7A3\nFMDdKK1bbaxqfYfcsgor/M8aD5NwNb119Ci90Fs3LmQS/sidWw89zqKJMRmxdtGj\njBGZ84a84k70H3tSepAlZ0nUnT0M5zUHRDX8tzuhbTfi6Zbyh8i962CH6sGBFwdV\nQpUFcLnw9IQXHBo15s5EtKNjg71S3TEIUQIDAQAB\n-----END RSA PUBLIC KEY-----\n'
  )`)
}

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM clients WHERE id='b311d654-6179-49f6-abc9-037ef758c6ef'`)
}
