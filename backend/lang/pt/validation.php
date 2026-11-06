<?php

// Mensagens em português para as regras usadas na API. Regras não listadas recorrem ao inglês do framework.
return [
    'accepted' => 'O campo :attribute tem de ser aceite.',
    'array' => 'O campo :attribute tem de ser uma lista.',
    'boolean' => 'O campo :attribute tem de ser verdadeiro ou falso.',
    'date' => 'O campo :attribute não é uma data válida.',
    'email' => 'O campo :attribute tem de ser um endereço de email válido.',
    'enum' => 'O valor seleccionado para :attribute não é válido.',
    'file' => 'O campo :attribute tem de ser um ficheiro.',
    'image' => 'O campo :attribute tem de ser uma imagem.',
    'in' => 'O valor seleccionado para :attribute não é válido.',
    'integer' => 'O campo :attribute tem de ser um número inteiro.',
    'max' => [
        'array' => 'O campo :attribute não pode ter mais de :max elementos.',
        'file' => 'O :attribute não pode ter mais de :max kilobytes.',
        'numeric' => 'O campo :attribute não pode ser superior a :max.',
        'string' => 'O campo :attribute não pode ter mais de :max caracteres.',
    ],
    'mimetypes' => 'O :attribute tem de ser de um dos tipos: :values.',
    'mimes' => 'O :attribute tem de ser de um dos tipos: :values.',
    'min' => [
        'array' => 'O campo :attribute tem de ter pelo menos :min elementos.',
        'file' => 'O :attribute tem de ter pelo menos :min kilobytes.',
        'numeric' => 'O campo :attribute tem de ser pelo menos :min.',
        'string' => 'O campo :attribute tem de ter pelo menos :min caracteres.',
    ],
    'not_regex' => 'O formato do campo :attribute não é válido.',
    'regex' => 'O formato do campo :attribute não é válido.',
    'required' => 'O campo :attribute é obrigatório.',
    'string' => 'O campo :attribute tem de ser texto.',
    'uploaded' => 'Não foi possível carregar o ficheiro :attribute.',
    'url' => 'O campo :attribute tem de ser um URL válido.',

    'attributes' => [
        'name' => 'nome',
        'email' => 'email',
        'password' => 'palavra-passe',
        'file' => 'ficheiro',
        'alt' => 'texto alternativo',
    ],
];
