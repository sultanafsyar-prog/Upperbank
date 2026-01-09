/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // add field
  collection.fields.addAt(20, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3307771590",
    "hidden": false,
    "id": "relation3808996463",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "material_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "number3559477917",
    "max": null,
    "min": null,
    "name": "qty_taken",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // remove field
  collection.fields.removeById("relation3808996463")

  // remove field
  collection.fields.removeById("number3559477917")

  return app.save(collection)
})
