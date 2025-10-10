INSERT INTO
	users (id, email, password_hash)
VALUES
	(
		'test-1',
		'test@email.com',
		'/yIDixvJ2kgR6fyzRBOncIYJ/76WGTLWQzJWTO7giTdZLJb/1tjbiI/C7jbtnAVj'
	),
	(
		'test-2',
		'test2@email.com',
		'/yIDixvJ2kgR6fyzRBOncIYJ/76WGTLWQzJWTO7giTdZLJb/1tjbiI/C7jbtnAVj'
	) ON CONFLICT DO NOTHING;
