/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "number3703245907",
    "max": null,
    "min": null,
    "name": "unit",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // remove field
  collection.fields.removeById("number3703245907")

  return app.save(collection)
})
