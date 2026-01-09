/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_468777862")

  // remove field
  collection.fields.removeById("relation3808996463")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_468777862")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3307771590",
    "hidden": false,
    "id": "relation3808996463",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "material_id",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
