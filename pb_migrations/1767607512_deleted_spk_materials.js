/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{10}",
        "hidden": false,
        "id": "text3208210256",
        "max": 10,
        "min": 5,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1746017644",
        "max": 0,
        "min": 0,
        "name": "spk_no",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text172692275",
        "max": 0,
        "min": 0,
        "name": "material_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text595418541",
        "max": 0,
        "min": 0,
        "name": "style",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number302785506",
        "max": null,
        "min": null,
        "name": "qty_in",
        "onlyInt": false,
        "presentable": true,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1724343031",
        "max": null,
        "min": null,
        "name": "qty_out",
        "onlyInt": false,
        "presentable": true,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1400097126",
        "max": 0,
        "min": 0,
        "name": "country",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2546635216",
        "max": 0,
        "min": 0,
        "name": "pic_owner",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "IN_STOCK",
          "PARTIAL_OUT",
          "OUT"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3725765462",
        "max": 0,
        "min": 0,
        "name": "created_by",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text385774305",
        "max": 0,
        "min": 0,
        "name": "updated_by",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1156222427",
        "max": 0,
        "min": 0,
        "name": "remarks",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number2344237674",
        "max": null,
        "min": null,
        "name": "qty_sisa",
        "onlyInt": false,
        "presentable": true,
        "required": false,
        "system": false,
        "type": "number"
      }
    ],
    "id": "pbc_3307771590",
    "indexes": [],
    "listRule": "",
    "name": "spk_materials",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
