/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // remove field
  collection.fields.removeById("number3703245907")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number302785506",
    "max": null,
    "min": null,
    "name": "qty_in",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number1724343031",
    "max": null,
    "min": null,
    "name": "qty_out",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
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

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number302785506",
    "max": null,
    "min": null,
    "name": "qty_in",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number1724343031",
    "max": null,
    "min": null,
    "name": "qty_out",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
